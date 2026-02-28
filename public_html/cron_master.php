<?php
// cron_master.php
ini_set('display_errors', 1);
error_reporting(E_ALL);
date_default_timezone_set('Asia/Ho_Chi_Minh');

require_once __DIR__ . '/db_config.php';

// Hàm triggerPusher dùng chung cho các tác vụ cron
function triggerPusherCron($receiversArray) {
    // Thông số lấy chính xác từ api.php của bạn
    $app_id = '2119393'; 
    $app_key = 'c5f3d216943b00f1f6cd';
    $app_secret = 'd575afaaf564813724c2';
    $cluster = 'ap1';
    
    $host = "api-".$cluster.".pusher.com";
    $path = "/apps/".$app_id."/events";
    
    $payload = [
        'name' => 'new-notification',
        'channels' => ['ktc-notifications'],
        'data' => json_encode(['receivers' => $receiversArray])
    ];
    
    $body = json_encode($payload);
    $auth_timestamp = time();
    $auth_version = '1.0';
    $body_md5 = md5($body);
    
    $string_to_sign = "POST\n$path\nauth_key=$app_key&auth_timestamp=$auth_timestamp&auth_version=$auth_version&body_md5=$body_md5";
    $auth_signature = hash_hmac('sha256', $string_to_sign, $app_secret);
    
    $url = "https://$host$path?auth_key=$app_key&auth_timestamp=$auth_timestamp&auth_version=$auth_version&body_md5=$body_md5&auth_signature=$auth_signature";
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5); // Tăng timeout lên 5s cho ổn định
    curl_exec($ch);
    curl_close($ch);
}

class CronMaster {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    private function log($name, $status, $message, $runtime) {
        $stmt = $this->pdo->prepare("INSERT INTO cron_logs (cron_name, status, message, runtime) VALUES (?, ?, ?, ?)");
        $stmt->execute([$name, $status, $message, $runtime]);
    }

    // TÁC VỤ 1: NHẮC NHỞ SỰ KIỆN (Từ file cron_reminders.php cũ)
    public function runEventReminders() {
        $start = microtime(true);
        try {
            $this->pdo->exec("SET time_zone = '+07:00'");
            $sql = "SELECT * FROM company_events WHERE start_datetime > NOW() AND start_datetime <= DATE_ADD(NOW(), INTERVAL 10 MINUTE)";
            $events = $this->pdo->query($sql)->fetchAll();
            $count = 0;

            foreach ($events as $e) {
        $event_id = $e['id'];
        
        // 1. Xác định danh sách tất cả những người cần nhận thông báo
        $target_receivers = [(int)$e['created_by']];
        if ($e['notify_type'] === 'ALL') {
            $u_stmt = $this->pdo->query("SELECT id FROM users WHERE active = 1");
            $target_receivers = array_merge($target_receivers, $u_stmt->fetchAll(PDO::FETCH_COLUMN));
        } else {
            $specific = json_decode($e['notify_users'], true);
            if (is_array($specific)) $target_receivers = array_merge($target_receivers, $specific);
        }
        $target_receivers = array_unique(array_map('intval', $target_receivers));

        // 2. Lấy danh sách những ID đã được gửi nhắc nhở rồi (tránh gửi lặp)
        $check_stmt = $this->pdo->prepare("SELECT user_id FROM notifications WHERE type = 'EVENT_REMINDER' AND related_id = ?");
        $check_stmt->execute([$event_id]);
        $already_notified = $check_stmt->fetchAll(PDO::FETCH_COLUMN);

        // 3. Lọc ra những người thực sự cần gửi bây giờ (Chưa có trong danh sách đã gửi)
        $final_receivers = array_diff($target_receivers, $already_notified);

        if (!empty($final_receivers)) {
            $time_str = date('H:i', strtotime($e['start_datetime']));
            $message = "⏳ NHẮC NHỞ: Sự kiện '{$e['title']}' sắp bắt đầu lúc {$time_str}.";

            $n_stmt = $this->pdo->prepare("INSERT INTO notifications (user_id, sender_id, message, type, related_id, is_read, created_at) VALUES (?, 1, ?, 'EVENT_REMINDER', ?, 0, NOW())");
            
            foreach ($final_receivers as $uid) {
                $n_stmt->execute([(int)$uid, $message, $event_id]);
            }

            // BẮN PUSHER: Chỉ bắn cho những người vừa mới được insert thông báo
            triggerPusherCron(array_values($final_receivers));
            $count++;
        }
    }
            $this->log('Event Reminder', 'success', "Đã gửi $count nhắc nhở sự kiện.", microtime(true) - $start);
        } catch (Exception $e) {
            $this->log('Event Reminder', 'error', $e->getMessage(), microtime(true) - $start);
        }
    }

    // TÁC VỤ 2: NHẮC NHỞ TASK (3 mốc: 1 ngày, 1 giờ, 10 phút)
    public function runTaskReminders() {
        $start = microtime(true);
        try {
            $sql = "SELECT t.*, u.id as user_id FROM tasks t JOIN users u ON t.assigneeId = u.id WHERE t.status IN (1, 2) AND t.notify_steps < 3";
            $tasks = $this->pdo->query($sql)->fetchAll();
            $count = 0;
            $now = time();

            foreach ($tasks as $t) {
                $endTime = strtotime($t['endTime']);
                $minutesLeft = ($endTime - $now) / 60;
                $step = (int)$t['notify_steps'];
                $msg = ""; $newStep = $step;

                if ($minutesLeft <= 1440 && $minutesLeft > 60 && $step < 1) {
                    $msg = "⏰ Task '{$t['title']}' còn 1 ngày là hết hạn!";
                    $newStep = 1;
                } elseif ($minutesLeft <= 60 && $minutesLeft > 10 && $step < 2) {
                    $msg = "⚠️ GẤP: Task '{$t['title']}' còn 1 tiếng nữa!";
                    $newStep = 2;
                } elseif ($minutesLeft <= 10 && $minutesLeft > 0 && $step < 3) {
                    $msg = "🚨 CẢNH BÁO: Task '{$t['title']}' còn 10 phút cuối cùng!";
                    $newStep = 3;
                }

                if ($msg !== "") {
                    $stmtN = $this->pdo->prepare("INSERT INTO notifications (user_id, sender_id, message, type, related_id, is_read, created_at) VALUES (?, 1, ?, 'TASK_REMIND', ?, 0, NOW())");
                    $stmtN->execute([(int)$t['user_id'], $msg, $t['id']]);
                    $this->pdo->prepare("UPDATE tasks SET notify_steps = ? WHERE id = ?")->execute([$newStep, $t['id']]);
                    triggerPusherCron([(int)$t['user_id']]);
                    $count++;
                }
            }
            $this->log('Task Reminder', 'success', "Đã gửi $count nhắc nhở task.", microtime(true) - $start);
        } catch (Exception $e) {
            $this->log('Task Reminder', 'error', $e->getMessage(), microtime(true) - $start);
        }
    }
}

$master = new CronMaster($pdo);
$master->runEventReminders();
$master->runTaskReminders();
echo "Cron Master finished at " . date('H:i:s');