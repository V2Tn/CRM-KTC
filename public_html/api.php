<?php
// api.php
session_start();
require_once 'db_config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Xử lý Preflight Request cho trình duyệt
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$contentType = $_SERVER["CONTENT_TYPE"] ?? '';
$params = [];

if (strpos($contentType, "application/json") !== false) {
    $params = json_decode(file_get_contents('php://input'), true) ?? [];
} else {
    // Nếu là Upload file (FormData) thì lấy từ $_POST
    $params = array_merge($_GET, $_POST);
}
$action = strtolower($params['action'] ?? '');

/**
 * Helper trả về lỗi
 */
function sendError($message) {
    echo json_encode(['status' => 'error', 'success' => false, 'message' => $message]);
    exit;
}

/**
 * Helper trả về thành công
 */
function sendSuccess($data = null) {
    $response = ['status' => 'success', 'success' => true];
    if ($data !== null) $response = array_merge($response, $data);
    echo json_encode($response);
    exit;
}


/**
 * Helper tạo nội dung log
 */
function appendLog($oldLog, $actionParams) {
    $time = date('H:i d/m');
    $user = $_SESSION['user']['fullName'] ?? 'System';
    return ($oldLog ? $oldLog . "\n" : "") . "[$time] $user: $actionParams";
}

/**
 * Helper: Bắn tín hiệu Real-time qua Pusher
 */
function triggerPusher($receiversArray) {
    // ĐIỀN THÔNG TIN TỪ PUSHER CỦA BẠN VÀO ĐÂY
    $app_id = '2119393';
    $app_key = 'c5f3d216943b00f1f6cd';
    $app_secret = 'd575afaaf564813724c2';
    $cluster = 'ap1';
    
    $host = "api-".$cluster.".pusher.com";
    $path = "/apps/".$app_id."/events";
    
    // Đóng gói dữ liệu gửi đi (Chỉ gửi mảng ID người nhận để bảo mật)
    $payload = [
        'name' => 'new-notification',
        'channels' => ['ktc-notifications'],
        'data' => json_encode(['receivers' => $receiversArray])
    ];
    
    $body = json_encode($payload);
    $auth_timestamp = time();
    $auth_version = '1.0';
    $body_md5 = md5($body);
    
    // Ký xác thực API (Chống mạo danh)
    $string_to_sign = "POST\n$path\nauth_key=$app_key&auth_timestamp=$auth_timestamp&auth_version=$auth_version&body_md5=$body_md5";
    $auth_signature = hash_hmac('sha256', $string_to_sign, $app_secret);
    
    $url = "https://$host$path?auth_key=$app_key&auth_timestamp=$auth_timestamp&auth_version=$auth_version&body_md5=$body_md5&auth_signature=$auth_signature";
    
    // Gửi tín hiệu đi bằng cURL
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 2); // Chỉ cho phép chạy 2s để không làm chậm web
    curl_exec($ch);
    curl_close($ch);
}

$publicActions = ['login'];
if (!empty($action) && !in_array($action, $publicActions) && !isset($_SESSION['user'])) {
    echo json_encode(['status' => 'unauthorized', 'success' => false, 'message' => 'Phiên làm việc đã hết hạn.']);
    exit;
}

// --- BẮT ĐẦU XỬ LÝ SWITCH CASE ---

switch ($action) {

    // ==========================================
    // 1. MODULE AUTH (ĐĂNG NHẬP)
    // ==========================================
    case 'login':
        $username = trim($params['username'] ?? '');
        $password = trim($params['password'] ?? '');

        if (empty($username) || empty($password)) {
            sendError('Vui lòng nhập đầy đủ tài khoản và mật khẩu');
        }

        $stmt = $pdo->prepare("SELECT u.*, r.code as role_code, r.name as role_name FROM users u LEFT JOIN roles r ON u.role = r.id WHERE u.username = ? AND u.active = 1");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user && $user['password'] === $password) {
            $_SESSION['user'] = [
                'id' => $user['id'],
                'fullName' => $user['fullName'],
                'username' => $user['username'],
                'avatar' => $user['avatar'] ?? '',
                'role' => $user['role_code'] ?? 'STAFF',
                'role_name' => $user['role_name'] ?? 'Nhân viên',
                'role_id' => $user['role'],
                'department_id' => $user['department']
            ];
            sendSuccess(['user' => $_SESSION['user']]);
        } else {
            sendError('Sai tài khoản hoặc mật khẩu!');
        }
        break;

    case 'logout':
        session_destroy(); // Xóa toàn bộ phiên làm việc trên Server
        sendSuccess(['message' => 'Đã đăng xuất thành công']);
        break;

// ==========================================
    // MODULE PROFILE (DÙNG CHUNG TOÀN CỤC)
    // ==========================================
    
    // 1. Lấy thông tin chi tiết user để hiện lên Modal
    case 'get_profile_info':
        $uid = $params['user_id'] ?? 0;
        $stmt = $pdo->prepare("
            SELECT u.*, r.name as role_name, d.name as dept_name 
            FROM users u 
            LEFT JOIN roles r ON u.role = r.id 
            LEFT JOIN departments d ON u.department = d.id 
            WHERE u.id = ?
        ");
        $stmt->execute([$uid]);
        $user = $stmt->fetch();
        
        if ($user) {
            // Xóa password khỏi kết quả trả về để bảo mật
            unset($user['password']); 
            sendSuccess(['user' => $user]);
        } else {
            sendError('Không tìm thấy thông tin người dùng');
        }
        break;

    // 2. Cập nhật thông tin cá nhân (Họ tên, SĐT, Email, Pass)
    case 'update_profile':
        $id = $params['user_id'];
        $fullName = trim($params['fullname']);
        $phone = trim($params['phone']);
        $email = trim($params['email']);
        $pass = trim($params['password'] ?? '');

        if (empty($fullName)) sendError('Họ tên không được để trống');

        try {
            if (!empty($pass)) {
                // Nếu có nhập pass mới thì cập nhật cả pass
                $sql = "UPDATE users SET fullName=?, phone=?, email=?, password=? WHERE id=?";
                $args = [$fullName, $phone, $email, $pass, $id];
            } else {
                // Không nhập pass thì giữ nguyên
                $sql = "UPDATE users SET fullName=?, phone=?, email=? WHERE id=?";
                $args = [$fullName, $phone, $email, $id];
            }
            
            $pdo->prepare($sql)->execute($args);
            
            // Cập nhật lại session nếu người sửa là chính người đang đăng nhập
            if (isset($_SESSION['user']) && $_SESSION['user']['id'] == $id) {
                $_SESSION['user']['fullName'] = $fullName;
            }
            
            sendSuccess(['message' => 'Cập nhật hồ sơ thành công!']);
        } catch (Exception $e) {
            sendError('Lỗi hệ thống: ' . $e->getMessage());
        }
        break;

    // ==========================================
    // 2. MODULE STAFF (NHÂN SỰ)
    // ==========================================
    case 'fetch_all_staff':
        $stmt = $pdo->query("SELECT u.*, d.name as dept_name, r.name as role_name FROM users u LEFT JOIN departments d ON u.department = d.id LEFT JOIN roles r ON u.role = r.id ORDER BY u.id DESC");
        sendSuccess(['data' => $stmt->fetchAll()]);
        break;

    case 'create_staff':
        $username = trim($params['username'] ?? '');
        $check = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $check->execute([$username]);
        if($check->fetch()) sendError('Tài khoản đã tồn tại!');

        $stmt = $pdo->prepare("INSERT INTO users (username, password, fullName, email, phone, role, department, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        if ($stmt->execute([
            $username, $params['password'], trim($params['fullName']), 
            $params['email']??'', $params['phone']??'', 
            $params['role']??'STAFF', $params['department']??null, $params['active']??1
        ])) {
            sendSuccess(['message' => 'Tạo thành công']);
        } else sendError('Lỗi SQL');
        break;

    case 'update_staff':
        $id = $params['id'];
        $pass = trim($params['password'] ?? '');
        if (empty($pass)) {
            $sql = "UPDATE users SET fullName=?, email=?, phone=?, role=?, department=?, active=? WHERE id=?";
            $args = [$params['fullName'], $params['email'], $params['phone'], $params['role'], $params['department'], $params['active'], $id];
        } else {
            $sql = "UPDATE users SET fullName=?, email=?, phone=?, role=?, department=?, active=?, password=? WHERE id=?";
            $args = [$params['fullName'], $params['email'], $params['phone'], $params['role'], $params['department'], $params['active'], $pass, $id];
        }
        $pdo->prepare($sql)->execute($args);
        sendSuccess(['message' => 'Cập nhật thành công']);
        break;

    case 'delete_staff':
        $id = $params['id'] ?? 0;
        if ($id == 1) sendError('Không thể xóa Admin hệ thống!');
        $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$id]);
        sendSuccess(['message' => 'Đã xóa nhân viên']);
        break;

    case 'fetch_roles':
        $stmt = $pdo->query("SELECT * FROM roles ORDER BY id ASC");
        sendSuccess(['data' => $stmt->fetchAll()]);
        break;

    case 'fetch_available_users':
        $sql = "SELECT u.id, u.fullName, u.email, u.role, u.avatar, d.name as current_dept_name FROM users u LEFT JOIN departments d ON u.department = d.id WHERE u.active = 1 ORDER BY u.fullName ASC";
        $stmt = $pdo->query($sql);
        sendSuccess(['data' => $stmt->fetchAll()]);
        break;

    // ==========================================
    // 3. MODULE DEPARTMENT (PHÒNG BAN)
    // ==========================================
    case 'fetch_deparments':
       $role = $_SESSION['user']['role'];
        $myDeptId = $_SESSION['user']['department_id'];

        $sql = "SELECT d.*, COUNT(u.id) as staff_count FROM departments d LEFT JOIN users u ON d.id = u.department";
        
        // [LOGIC MỚI] Nếu là MANAGER, chỉ lấy phòng ban của mình
        if ($role === 'MANAGER') {
            $sql .= " WHERE d.id = $myDeptId";
        }
        
        $sql .= " GROUP BY d.id ORDER BY d.id ASC";
        
        $stmt = $pdo->query($sql);
        sendSuccess(['data' => $stmt->fetchAll()]);
        break;

    case 'create_department':
        if ($_SESSION['user']['role'] === 'MANAGER') sendError('Bạn không có quyền tạo phòng ban');
        $name = trim($params['name']);
        if (empty($name)) sendError('Tên phòng trống');
        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("INSERT INTO departments (name, description, managerId) VALUES (?, ?, ?)");
            $stmt->execute([$name, $params['description'], $params['manager_id'] ?? null]);
            $newId = $pdo->lastInsertId();
            if (!empty($params['members'])) {
                $placeholders = implode(',', array_fill(0, count($params['members']), '?'));
                $pdo->prepare("UPDATE users SET department = ? WHERE id IN ($placeholders)")->execute(array_merge([$newId], $params['members']));
            }
            $pdo->commit();
            sendSuccess(['message' => 'Tạo thành công']);
        } catch (Exception $e) { $pdo->rollBack(); sendError($e->getMessage()); }
        break;

    case 'update_department':
        $id = $params['id'];
        $role = $_SESSION['user']['role'];
        $myDeptId = $_SESSION['user']['department_id'];

        if ($role === 'MANAGER' && $id != $myDeptId) {
            sendError('Bạn không có quyền sửa phòng ban này');
        }

        try {
            $pdo->beginTransaction();

            // ==========================================
            // 1. TÌM ÔNG QUẢN LÝ CŨ TRƯỚC (BẮT BUỘC NẰM Ở ĐÂY)
            // ==========================================
            $stmtOldMgr = $pdo->prepare("SELECT managerId FROM departments WHERE id = ?");
            $stmtOldMgr->execute([$id]);
            $oldManagerId = $stmtOldMgr->fetchColumn();

            // ==========================================
            // 2. BÂY GIỜ MỚI CẬP NHẬT PHÒNG BAN (UPDATE)
            // ==========================================
            if ($role === 'MANAGER') {
                $pdo->prepare("UPDATE departments SET description=? WHERE id=?")->execute([$params['description'], $id]);
            } else {
                $pdo->prepare("UPDATE departments SET name=?, description=?, managerId=? WHERE id=?")->execute([$params['name'], $params['description'], $params['manager_id'] ?? null, $id]);
            }

            // ==========================================
            // 3. CẬP NHẬT THÀNH VIÊN VÀO PHÒNG
            // ==========================================
            $pdo->prepare("UPDATE users SET department = 0 WHERE department = ?")->execute([$id]);
            if (!empty($params['members'])) {
                $placeholders = implode(',', array_fill(0, count($params['members']), '?'));
                $pdo->prepare("UPDATE users SET department = ? WHERE id IN ($placeholders)")->execute(array_merge([$id], $params['members']));
            }

            // ==========================================
            // 4. LOGIC TỰ ĐỘNG CÁCH CHỨC & THĂNG CHỨC
            // ==========================================
            $newManagerId = $params['manager_id'] ?? null;
    
            if ($newManagerId != $oldManagerId) {
                if (!empty($oldManagerId)) {
                    // Lấy chức vụ hiện tại của ông cũ ra kiểm tra
                    $stmtRole = $pdo->prepare("SELECT role FROM users WHERE id = ?");
                    $stmtRole->execute([$oldManagerId]);
                    $oldRole = $stmtRole->fetchColumn();

                    if ($oldRole == 3 || $oldRole == 4) {
                        $pdo->prepare("UPDATE users SET role = 5 WHERE id = ?")->execute([$oldManagerId]);
                    }
                }

                // B. XỬ LÝ ÔNG QUẢN LÝ MỚI
                if (!empty($newManagerId)) {
                    $pdo->prepare("UPDATE users SET department = ? WHERE id = ?")->execute([$id, $newManagerId]);
                }
            }
            $pdo->commit();
            sendSuccess(['message' => 'Cập nhật thành công']);
        } catch (Exception $e) { 
            $pdo->rollBack(); 
            sendError($e->getMessage()); 
        }
        break;

    case 'delete_department':
        if ($_SESSION['user']['role'] === 'MANAGER') sendError('Bạn không có quyền xóa phòng ban');

        $id = $params['id'];
        try {
            $pdo->beginTransaction();
            $pdo->prepare("UPDATE users SET department = 0 WHERE department = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM departments WHERE id = ?")->execute([$id]);
            $pdo->commit();
            sendSuccess(['message' => 'Đã xóa']);
        } catch (Exception $e) { $pdo->rollBack(); sendError($e->getMessage()); }
        break;

    case 'fetch_dept_members':
        $stmt = $pdo->prepare("SELECT id, fullName, email, role, avatar, (SELECT type FROM evaluations WHERE staff_id = users.id ORDER BY created_at DESC LIMIT 1) as latest_rating FROM users WHERE department = ? AND active = 1");
        $stmt->execute([$params['id']]);
        sendSuccess(['data' => $stmt->fetchAll()]);
        break;

    case 'fetch_managers_for_select':
        $sql = "SELECT u.id, u.fullName, u.username, u.avatar, d.name as current_dept_name, d.id as current_dept_id 
                FROM users u 
                LEFT JOIN roles r ON u.role = r.id
                LEFT JOIN departments d ON u.id = d.managerId
                WHERE r.code IN ('MANAGER', 'ADMIN', 'SUPER_ADMIN') OR u.role IN (1, 2)
                ORDER BY u.fullName ASC";
        $stmt = $pdo->query($sql);
        sendSuccess(['data' => $stmt->fetchAll()]);
        break;

    // ==========================================
    // 4. MODULE TASKS (CÔNG VIỆC)
    // ==========================================
    case 'create_task':
        $title = trim($params['title'] ?? '');
        if (empty($title)) sendError('Tiêu đề trống');
        
        // 1. Chuẩn hóa biến ID (Sửa lỗi undefined variable)
        $createdById = $_SESSION['user']['id']; 
        $assigneeId = !empty($params['assigneeId']) ? $params['assigneeId'] : $createdById;
        
        // 2. Lấy tên nhân viên (Label)
        // Sử dụng prepare statement để an toàn hơn
        $stmtU = $pdo->prepare("SELECT fullName FROM users WHERE id = ?");
        $stmtU->execute([$assigneeId]);
        $u = $stmtU->fetch();
        $assigneeLabel = $u ? $u['fullName'] : 'NV';
        
        $createdByLabel = $_SESSION['user']['fullName'];

        // 3. Xử lý Log (Tránh lỗi 500 nếu hàm appendLog chưa khai báo)
        $logContent = "Tạo mới lúc " . date('H:i d/m/Y');
        if (function_exists('appendLog')) {
            $logContent = appendLog("", "Tạo mới");
        }

        // 4. Insert Task (Giữ nguyên tên cột camelCase theo DB của bạn)
        $sql = "INSERT INTO tasks (title, quadrant, status, assigneeId, assigneeLabel, createdById, createdByLabel, startTime, endTime, createdAt, log) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $pdo->prepare($sql);
        $res = $stmt->execute([
            $title, 
            $params['quadrant'] ?? 'do_first', 
            1, // Status 1 = Mới
            $assigneeId, 
            $assigneeLabel,
            $createdById, 
            $createdByLabel,
            $params['startTime'] ?? date('Y-m-d H:i:s'), 
            $params['endTime'] ?? date('Y-m-d 23:59:59'), 
            date('Y-m-d H:i:s'),
            $logContent
        ]);

        if ($res) {
            $taskId = $pdo->lastInsertId();

            // 5. TẠO THÔNG BÁO (Chỉ khi giao cho người khác)
            if ($assigneeId != $createdById) { 
               $msg = "Bạn được giao công việc mới: " . $title;
                $stmtNoti = $pdo->prepare("INSERT INTO notifications (user_id, sender_id, message, type, related_id) VALUES (?, ?, ?, 'NEW_TASK', ?)");
                $stmtNoti->execute([$assigneeId, $createdById, $msg, $taskId]);

                // GỌI PUSHER BẮN TÍN HIỆU CHO NGƯỜI NHẬN
                triggerPusher([(int)$assigneeId]);
            }

            sendSuccess(['message' => 'Thành công', 'taskId' => $taskId]);
        } else {
            sendError('Lỗi tạo task');
        }
        break;
    case 'fetch_my_tasks':
        $uid = $params['userId'] ?? $_SESSION['user']['id'];
        $stmt = $pdo->prepare("SELECT t.*, s.name as status_name, s.color as status_color FROM tasks t LEFT JOIN task_status s ON t.status = s.id WHERE t.assigneeId = ? ORDER BY t.id DESC");
        $stmt->execute([$uid]);
        sendSuccess(['data' => $stmt->fetchAll()]);
        break;

    case 'update_task_status':
        $id = $params['id'];
        $status = $params['status'];
        $currentUserId = $_SESSION['user']['id'];
        $currentUserName = $_SESSION['user']['fullName'];
        $stmtGet = $pdo->prepare("SELECT title, log, createdById, assigneeId, endTime, isOverdue FROM tasks WHERE id = ?");
        $stmtGet->execute([$id]);
        $task = $stmtGet->fetch();
        
        if (!$task) sendError('Không tìm thấy công việc');

        $statusMap = [1=>'MỚI', 2=>'ĐANG LÀM', 3=>'HOÀN THÀNH', 4=>'HỦY'];
        $newLog = appendLog($task['log'] ?? '', "Chuyển trạng thái sang " . ($statusMap[$status] ?? 'KHÁC'));

        // ==========================================
        // 2. LOGIC TỰ ĐỘNG XỬ LÝ TRỄ HẠN 
        // ==========================================
        $isOverdue = (int)$task['isOverdue']; // Mặc định lấy giá trị cũ
        
        if (!empty($task['endTime'])) {
            $endTimeTimestamp = strtotime($task['endTime']);
            $currentTimestamp = time();

            if ($currentTimestamp > $endTimeTimestamp) {
                $isOverdue = 1;
            } 

            else if ($status == 3) {
                $isOverdue = 0;
            }
        }
        $pdo->prepare("UPDATE tasks SET status = ?, isOverdue = ?, log = ?, updatedAt = NOW() WHERE id = ?")
            ->execute([$status, $isOverdue, $newLog, $id]);

        // ==========================================
        // 4. GỬI THÔNG BÁO KHI HOÀN THÀNH
        // ==========================================
        if ($task['createdById'] != $currentUserId) {
            $taskTitle = $task['title'];
            $msg = "";
            $notiType = "";
            
            if ($status == 3) { 
                $msg = "{$currentUserName} đã HOÀN THÀNH công việc: {$taskTitle}";
                $notiType = 'TASK_DONE';
            } elseif ($status == 4) { 
                $msg = "{$currentUserName} đã HỦY công việc: {$taskTitle}";
                $notiType = 'TASK_CANCEL';
            } elseif ($status == 1) { 
                $msg = "{$currentUserName} muốn LÀM LẠI công việc: {$taskTitle}";
                $notiType = 'TASK_REDO';
            }

            if ($msg !== "") {
                $stmtNoti = $pdo->prepare("INSERT INTO notifications (user_id, sender_id, message, type, related_id) VALUES (?, ?, ?, ?, ?)");
                $stmtNoti->execute([$task['createdById'], $currentUserId, $msg, $notiType, $id]);
                
                triggerPusher([(int)$task['createdById']]);
            }
        }

        sendSuccess();
        break;

    case 'update_task_quadrant':
        $id = $params['id'];
        // [QUAN TRỌNG] Cập nhật vào trường newQuadrant theo yêu cầu
        $newQuadrant = $params['newQuadrant'] ?? $params['quadrant'];
        
        $stmtGet = $pdo->prepare("SELECT log FROM tasks WHERE id = ?");
        $stmtGet->execute([$id]);
        $task = $stmtGet->fetch();
        $newLog = appendLog($task['log'] ?? '', "Di chuyển sang ô: $newQuadrant");

        $pdo->prepare("UPDATE tasks SET newQuadrant = ?, log = ?, updatedAt = NOW() WHERE id = ?")->execute([$newQuadrant, $newLog, $id]);
        sendSuccess(['message' => 'Đã cập nhật vị trí mới']);
        break;

    case 'delete_task':
        $pdo->prepare("DELETE FROM tasks WHERE id = ?")->execute([$params['id']]);
        sendSuccess();
        break;

    case 'update_task_title':
        $pdo->prepare("UPDATE tasks SET title = ? WHERE id = ?")->execute([$params['title'], $params['id']]);
        sendSuccess();
        break;

    case 'fetch_assignable_users':
        $role = $_SESSION['user']['role'];
        if($role === 'MANAGER') {
            $stmt = $pdo->prepare("SELECT u.id, u.fullName, u.avatar, d.name as dept_name FROM users u LEFT JOIN departments d ON u.department = d.id WHERE u.department = ? AND u.active = 1 ORDER BY u.fullName ASC");
            $stmt->execute([$_SESSION['user']['department_id']]);
        } else {
            $stmt = $pdo->query("SELECT u.id, u.fullName, u.avatar, d.name as dept_name FROM users u LEFT JOIN departments d ON u.department = d.id WHERE u.active = 1 ORDER BY u.fullName ASC");
        }
        sendSuccess(['data' => $stmt->fetchAll()]);
        break;

    // ==========================================
    // 5. MODULE TEAM & STATS
    // ==========================================
    case 'fetch_team_stats':
        $days = isset($params['days']) ? intval($params['days']) : 0;
        $role = $_SESSION['user']['role'] ?? 'STAFF';
        $myDeptId = $_SESSION['user']['department_id'] ?? 0;
        $myId = $_SESSION['user']['id'];

        $dateCondition = ($days == 0) ? "AND t.createdAt >= CURDATE()" : "AND t.createdAt >= DATE_SUB(NOW(), INTERVAL $days DAY)";
        
        $whereUser = "u.active = 1";
        $paramsUser = [];
        if ($role === 'MANAGER') {
            $whereUser .= " AND u.department = ?";
            $paramsUser[] = $myDeptId;
        } elseif ($role !== 'ADMIN' && $role !== 'SUPER_ADMIN') {
            $whereUser .= " AND u.id = ?";
            $paramsUser[] = $myId;
        }

        // [MỚI] Thêm dòng count_done_on_time để đo SLA
        $sql = "SELECT 
                    u.id, u.fullName, u.email, d.id as dept_id, d.name as dept_name, u.avatar,
                    COUNT(t.id) as total_tasks,
                    COALESCE(SUM(CASE WHEN t.status = 1 THEN 1 ELSE 0 END), 0) as count_new,
                    COALESCE(SUM(CASE WHEN t.status = 2 THEN 1 ELSE 0 END), 0) as count_doing,
                    COALESCE(SUM(CASE WHEN t.status = 3 THEN 1 ELSE 0 END), 0) as count_done,
                    COALESCE(SUM(CASE WHEN t.status = 3 AND (t.isOverdue = 0 OR t.isOverdue IS NULL) THEN 1 ELSE 0 END), 0) as count_done_on_time,
                    COALESCE(SUM(CASE WHEN t.status = 4 THEN 1 ELSE 0 END), 0) as count_cancel,
                    COALESCE(SUM(CASE WHEN (t.status = 1 OR t.status = 2) AND t.endTime < NOW() THEN 1 ELSE 0 END), 0) as count_overdue,
                    (SELECT type FROM evaluations WHERE staff_id = u.id ORDER BY created_at DESC LIMIT 1) as latest_rating
                FROM users u
                LEFT JOIN departments d ON u.department = d.id
                LEFT JOIN tasks t ON u.id = t.assigneeId $dateCondition
                WHERE $whereUser GROUP BY u.id ORDER BY d.id ASC, u.fullName ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($paramsUser);
        $data = $stmt->fetchAll();

        $globalStats = ['staff' => count($data), 'new' => 0, 'doing' => 0, 'done' => 0, 'done_on_time' => 0, 'cancel' => 0, 'overdue' => 0, 'total' => 0];
        foreach ($data as $row) {
            $globalStats['new'] += $row['count_new']; $globalStats['doing'] += $row['count_doing'];
            $globalStats['done'] += $row['count_done']; $globalStats['cancel'] += $row['count_cancel'];
            $globalStats['overdue'] += $row['count_overdue']; $globalStats['total'] += $row['total_tasks'];
            $globalStats['done_on_time'] += $row['count_done_on_time'];
        }

        if ($role === 'ADMIN' || $role === 'SUPER_ADMIN') {
            $departments = [];
            foreach ($data as $row) {
                $dId = $row['dept_id'] ?? 0;
                if (!isset($departments[$dId])) {
                    $departments[$dId] = ['id' => $dId, 'name' => $row['dept_name'] ?? 'Chưa phân phòng', 'members' => [], 'stats' => ['new'=>0,'doing'=>0,'done'=>0,'done_on_time'=>0,'cancel'=>0,'overdue'=>0]];
                }
                $departments[$dId]['members'][] = $row;
                $departments[$dId]['stats']['new'] += $row['count_new'];
                $departments[$dId]['stats']['doing'] += $row['count_doing'];
                $departments[$dId]['stats']['done'] += $row['count_done'];
                $departments[$dId]['stats']['done_on_time'] += $row['count_done_on_time'];
                $departments[$dId]['stats']['cancel'] += $row['count_cancel'];
                $departments[$dId]['stats']['overdue'] += $row['count_overdue'];
            }
            sendSuccess(['type' => 'departments', 'data' => array_values($departments), 'totalStats' => $globalStats]);
        } else {
            sendSuccess(['type' => 'members', 'data' => $data, 'totalStats' => $globalStats]);
        }
        break;

    case 'fetch_member_tasks':
        $targetUserId = $params['user_id'] ?? 0;
        $days = isset($params['days']) ? intval($params['days']) : 0;
        $dateCondition = ($days == 0) ? "AND createdAt >= CURDATE()" : "AND createdAt >= DATE_SUB(NOW(), INTERVAL $days DAY)";
        $stmt = $pdo->prepare("SELECT * FROM tasks WHERE assigneeId = ? $dateCondition ORDER BY id DESC");
        $stmt->execute([$targetUserId]);
        $tasks = $stmt->fetchAll();
        $stmtU = $pdo->prepare("SELECT id, fullName, avatar, email, role FROM users WHERE id = ?");
        $stmtU->execute([$targetUserId]);
        sendSuccess(['user' => $stmtU->fetch(), 'tasks' => $tasks]);
        break;

    case 'evaluate_staff':
      $managerId = $_SESSION['user']['id'];
        $staffId = $params['staff_id'];
        $type = $params['type'];
        $note = isset($params['note']) ? trim($params['note']) : '';

        // Kiểm tra hợp lệ
        if (!in_array($type, ['STAR', 'LIKE', 'DISLIKE'])) sendError('Loại đánh giá không hợp lệ');
        if ($_SESSION['user']['role'] === 'STAFF') sendError('Bạn không có quyền đánh giá');
        if ($managerId == $staffId) sendError('Không thể tự đánh giá chính mình');
        
        $currentMonth = date('Y-m'); // Lấy tháng hiện tại (VD: 2026-02)
        $typeText = ($type == 'STAR') ? 'XUẤT SẮC 🏆' : (($type == 'LIKE') ? 'TỐT 👍' : 'CẦN CẢI THIỆN 👎');

        try {
            // Kiểm tra xem THÁNG NÀY nhân viên đã được đánh giá chưa?
            $stmtCheck = $pdo->prepare("
                SELECT id FROM evaluations 
                WHERE staff_id = ? AND DATE_FORMAT(created_at, '%Y-%m') = ?
            ");
            $stmtCheck->execute([$staffId, $currentMonth]);
            $existingEval = $stmtCheck->fetch();

            if ($existingEval) {
                // ĐÃ ĐÁNH GIÁ -> CẬP NHẬT LẠI (Ghi vào cột updated_at, giữ nguyên created_at)
                $evalId = $existingEval['id'];
                
                $stmtUpdate = $pdo->prepare("
                    UPDATE evaluations 
                    SET type = ?, note = ?, manager_id = ?, updated_at = NOW() 
                    WHERE id = ?
                ");
                
                if ($stmtUpdate->execute([$type, $note, $managerId, $evalId])) {
                    // Gửi thông báo Sếp vừa cập nhật lại điểm
                    $msg = "Quản lý đã cập nhật lại đánh giá tháng này của bạn thành: {$typeText}.";
                    $stmtNoti = $pdo->prepare("INSERT INTO notifications (user_id, sender_id, message, type, related_id) VALUES (?, ?, ?, 'EVALUATION', ?)");
                    $stmtNoti->execute([$staffId, $managerId, $msg, $evalId]);
                    triggerPusher([(int)$staffId]);
                    sendSuccess(['message' => 'Đã cập nhật lại đánh giá tháng này!', 'type' => $type]);
                } else {
                    sendError('Lỗi khi cập nhật đánh giá');
                }

            } else {
                // CHƯA ĐÁNH GIÁ -> TẠO MỚI (Chỉ ghi vào cột created_at)
                $stmtInsert = $pdo->prepare("
                    INSERT INTO evaluations (staff_id, manager_id, type, note, created_at) 
                    VALUES (?, ?, ?, ?, NOW())
                ");
                
                if ($stmtInsert->execute([$staffId, $managerId, $type, $note])) {
                    $evalId = $pdo->lastInsertId();
                    
                    // Gửi thông báo đánh giá mới
                    $msg = "Bạn nhận được đánh giá {$typeText} từ quản lý cho tháng này.";
                    $stmtNoti = $pdo->prepare("INSERT INTO notifications (user_id, sender_id, message, type, related_id) VALUES (?, ?, ?, 'EVALUATION', ?)");
                    $stmtNoti->execute([$staffId, $managerId, $msg, $evalId]);

                    // THÊM DÒNG NÀY ĐỂ BẮN PUSHER CHO NHÂN VIÊN
                    triggerPusher([(int)$staffId]);

                    sendSuccess(['message' => 'Đánh giá thành công!', 'type' => $type]);
                } else {
                    sendError('Lỗi lưu đánh giá mới');
                }
            }
        } catch (Exception $e) {
            sendError("Lỗi hệ thống: " . $e->getMessage());
        }
        break;
    // ==========================================
    // 6. Report
    // ==========================================

    case 'fetch_report_data':
    $uid = $_SESSION['user']['id'];
    $period = $params['period'] ?? 'today'; // Mặc định là hôm nay
    $chartData = [];
    $startDate = '';
    
    if (isset($params['filter']) && $params['filter'] === 'all') {
        $startDate = '2000-01-01 00:00:00';
    } else {
    if ($period === 'today') {
        $startDate = date('Y-m-d 00:00:00');
        for ($i = 0; $i < 24; $i++) {
            $hour = str_pad($i, 2, '0', STR_PAD_LEFT);
            $chartData[$hour] = ['label' => $hour . 'h', 'fullLabel' => "Giờ $hour:00", 'total' => 0, 'done' => 0];
        }
    } elseif ($period === 'week') {
        $startDate = date('Y-m-d 00:00:00', strtotime('-6 days'));
        for ($i = 6; $i >= 0; $i--) {
            $d = date('Y-m-d', strtotime("-$i days"));
            $chartData[$d] = ['label' => date('d/m', strtotime($d)), 'fullLabel' => "Ngày " . date('d/m', strtotime($d)), 'total' => 0, 'done' => 0];
        }
    } elseif ($period === 'month') {
        $startDate = date('Y-m-d 00:00:00', strtotime('-29 days'));
        for ($i = 29; $i >= 0; $i--) {
            $d = date('Y-m-d', strtotime("-$i days"));
            $label = ($i % 5 === 0) ? date('d/m', strtotime($d)) : '';
            $chartData[$d] = ['label' => $label, 'fullLabel' => "Ngày " . date('d/m', strtotime($d)), 'total' => 0, 'done' => 0];
        }
    } elseif ($period === 'year') { // [MỚI] Bộ lọc theo năm
        $startDate = date('Y-01-01 00:00:00');
        for ($i = 1; $i <= 12; $i++) {
            $m = date('Y-m', mktime(0, 0, 0, $i, 1, date('Y')));
            $chartData[$m] = ['label' => 'T' . $i, 'fullLabel' => "Tháng $i/" . date('Y'), 'total' => 0, 'done' => 0];
        }
    }
    }

   // 1. Lấy task CÁ NHÂN (Mình trực tiếp làm)
    $stmtMyTasks = $pdo->prepare("SELECT * FROM tasks WHERE assigneeId = ? AND (startTime >= ? OR createdAt >= ?) ORDER BY startTime DESC");
    $stmtMyTasks->execute([$uid, $startDate, $startDate]);
    $myTasks = $stmtMyTasks->fetchAll();

    // 2. Lấy task GIAO ĐI (Mình giao cho người khác)
    $stmtAssignedTasks = $pdo->prepare("SELECT * FROM tasks WHERE createdById = ? AND assigneeId != ? AND (startTime >= ? OR createdAt >= ?) ORDER BY startTime DESC");
    $stmtAssignedTasks->execute([$uid, $uid, $startDate, $startDate]);
    $assignedTasks = $stmtAssignedTasks->fetchAll();

    $myChartData = $chartData;
    $assignChartData = $chartData;

    // 1. Tính toán biểu đồ dựa trên MyTasks (Việc tôi làm)
    foreach ($myTasks as $t) {
        $timeString = !empty($t['startTime']) ? $t['startTime'] : $t['createdAt'];
        $time = strtotime($timeString);
        if (!$time) continue; 

        $key = ($period === 'today') ? date('H', $time) : ($period === 'year' ? date('Y-m', $time) : date('Y-m-d', $time));
        if (isset($myChartData[$key])) {
            $myChartData[$key]['total']++;
            if ($t['status'] == 3) $myChartData[$key]['done']++;
        }
    }

    // 2. Tính toán biểu đồ dựa trên AssignedTasks (Việc tôi giao)
    foreach ($assignedTasks as $t) {
        $timeString = !empty($t['startTime']) ? $t['startTime'] : $t['createdAt'];
        $time = strtotime($timeString);
        if (!$time) continue; 

        $key = ($period === 'today') ? date('H', $time) : ($period === 'year' ? date('Y-m', $time) : date('Y-m-d', $time));
        if (isset($assignChartData[$key])) {
            $assignChartData[$key]['total']++;
            if ($t['status'] == 3) $assignChartData[$key]['done']++;
        }
    }

    // 3. Trả về cho Frontend cả 2 cục dữ liệu biểu đồ
    sendSuccess([
        'myChartData' => array_values($myChartData),
        'assignChartData' => array_values($assignChartData),
        'myStats' => [
            'total' => count($myTasks),
            'done' => count(array_filter($myTasks, fn($t) => $t['status'] == 3))
        ],
        'assignStats' => [
            'total' => count($assignedTasks),
            'done' => count(array_filter($assignedTasks, fn($t) => $t['status'] == 3))
        ],
        'myTasks' => $myTasks,
        'assignedTasks' => $assignedTasks
    ]);
    break;

    // ==========================================
    // 7. Noti
    // ==========================================

    case 'fetch_notifications':
        $uid = $_SESSION['user']['id'];
        
        // Lấy 10 thông báo mới nhất
        $sql = "SELECT n.*, u.fullName as sender_name 
                FROM notifications n 
                LEFT JOIN users u ON n.sender_id = u.id 
                WHERE n.user_id = ? AND (n.is_deleted = 0 OR n.is_deleted IS NULL)
                ORDER BY n.created_at DESC LIMIT 15";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$uid]);
        $list = $stmt->fetchAll();
        
        // Đếm số lượng chưa đọc
        $stmtCount = $pdo->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0 AND (is_deleted = 0 OR is_deleted IS NULL)");
        $stmtCount->execute([$uid]);
        $unread = $stmtCount->fetchColumn();
        
        sendSuccess(['notifications' => $list, 'unread_count' => $unread]);
        break;

    case 'mark_read':
        $uid = $_SESSION['user']['id'];
        $notiId = $params['noti_id'] ?? null; 

        if ($notiId) {
            $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?");
            $stmt->execute([$notiId, $uid]);
        } else {
            // Nếu không truyền ID thì đánh dấu ĐỌC TẤT CẢ
            $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)");
            $stmt->execute([$uid]);
        }
        sendSuccess();
        break;

    case 'delete_notification':
        $uid = $_SESSION['user']['id'];
        $notiId = $params['noti_id'] ?? null;
        $type = $params['type'] ?? ''; 
        
        if ($type === 'all_read') {
            // Nút: XÓA TẤT CẢ NHỮNG THƯ ĐÃ ĐỌC
            $stmt = $pdo->prepare("UPDATE notifications SET is_deleted = 1 WHERE user_id = ? AND is_read = 1 AND (is_deleted = 0 OR is_deleted IS NULL)");
            $stmt->execute([$uid]);
            sendSuccess(['message' => 'Đã dọn dẹp các thông báo đã đọc']);
        } elseif ($notiId) {
            // Nút: XÓA 1 THÔNG BÁO CỤ THỂ
            $stmt = $pdo->prepare("UPDATE notifications SET is_deleted = 1 WHERE id = ? AND user_id = ?");
            $stmt->execute([$notiId, $uid]);
            sendSuccess(['message' => 'Đã xóa thông báo']);
        } else {
            sendError('Yêu cầu xóa không hợp lệ');
        }
        break;

    // ==========================================
    // 8. Upload Avtar
    // ==========================================
    case 'upload_avatar':
        if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
            sendError('Vui lòng chọn file ảnh hợp lệ');
        }

        $userId = $_SESSION['user']['id'];
        $file = $_FILES['avatar'];
        
        // 1. Kiểm tra định dạng & dung lượng
        $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        if (!in_array($ext, $allowed)) sendError('Chỉ chấp nhận file ảnh (jpg, png, gif, webp)');
        if ($file['size'] > 5 * 1024 * 1024) sendError('File quá lớn (Max 5MB)');

        // 2. Tạo tên file & thư mục
        $newFileName = "avatar_{$userId}_" . time() . ".{$ext}";
        $uploadDir = 'uploads/avatars/';
        
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);

        $destPath = $uploadDir . $newFileName;

        // 3. Di chuyển file & Cập nhật DB
        if (move_uploaded_file($file['tmp_name'], $destPath)) {
            // Update Database
            $stmt = $pdo->prepare("UPDATE users SET avatar = ? WHERE id = ?");
            $stmt->execute([$destPath, $userId]);

            // Update Session
            $_SESSION['user']['avatar'] = $destPath;

            sendSuccess(['message' => 'Đổi ảnh đại diện thành công!', 'avatarUrl' => $destPath]);
        } else {
            sendError('Lỗi server: Không thể lưu file');
        }
        break;

        // ==========================================
    // MODULE BẢNG XẾP HẠNG (LEADERBOARD)
    // ==========================================
    case 'fetch_leaderboard':
        $period = $params['period'] ?? 'month';
        
        $startDate = "";
        $endDate = "";
        
        // Xác định mốc thời gian (Đầu tháng đến cuối tháng)
        if ($period === 'month') {
            $startDate = date('Y-m-01 00:00:00');
            $endDate = date('Y-m-t 23:59:59');
        } elseif ($period === 'week') {
            $startDate = date('Y-m-d 00:00:00', strtotime('-7 days'));
            $endDate = date('Y-m-d 23:59:59');
        } else {
            $startDate = '2000-01-01 00:00:00';
            $endDate = '2099-12-31 23:59:59';
        }

        $taskCond = "AND ((updatedAt >= '$startDate' AND updatedAt <= '$endDate') OR (createdAt >= '$startDate' AND createdAt <= '$endDate'))";
        $evalCond = "AND created_at >= '$startDate' AND created_at <= '$endDate'";

        try {
            $sql = "
                SELECT 
                    u.id, 
                    u.fullName, 
                    u.avatar,
                    d.name as department_name,
                    COALESCE(t.total_tasks, 0) as total_tasks,
                    COALESCE(t.done_on_time, 0) as done_on_time,
                    COALESCE(t.done_late, 0) as done_late,
                    COALESCE(t.overdue_not_done, 0) as overdue_not_done,
                    COALESCE(e.star_count, 0) as star_count,
                    COALESCE(e.like_count, 0) as like_count,
                    COALESCE(e.dislike_count, 0) as dislike_count
                FROM users u
                LEFT JOIN departments d ON u.department = d.id
                LEFT JOIN (
                    -- Truy vấn gom nhóm Task
                    SELECT assigneeId,
                           COUNT(id) as total_tasks,
                           -- Hoàn thành đúng hạn (Status = 3 và isOverdue = 0 hoặc null)
                           SUM(CASE WHEN status = 3 AND (isOverdue = 0 OR isOverdue IS NULL) THEN 1 ELSE 0 END) as done_on_time,
                           -- Hoàn thành trễ hạn (Status = 3 và isOverdue = 1)
                           SUM(CASE WHEN status = 3 AND isOverdue = 1 THEN 1 ELSE 0 END) as done_late,
                           -- Chưa hoàn thành và đã trễ hạn (Status != 3 và isOverdue = 1)
                           SUM(CASE WHEN status != 3 AND isOverdue = 1 THEN 1 ELSE 0 END) as overdue_not_done
                    FROM tasks
                    WHERE 1=1 $taskCond
                    GROUP BY assigneeId
                ) t ON u.id = t.assigneeId
                LEFT JOIN (
                    -- Truy vấn gom nhóm Đánh giá (Chỉ tính trong tháng/tuần đó)
                    SELECT staff_id,
                           SUM(CASE WHEN type = 'STAR' THEN 1 ELSE 0 END) as star_count,
                           SUM(CASE WHEN type = 'LIKE' THEN 1 ELSE 0 END) as like_count,
                           SUM(CASE WHEN type = 'DISLIKE' THEN 1 ELSE 0 END) as dislike_count
                    FROM evaluations
                    WHERE 1=1 $evalDateCond
                    GROUP BY staff_id
                ) e ON u.id = e.staff_id
                WHERE u.role != 'SUPER ADMIN'
            ";
            
            $stmt = $pdo->query($sql);
            $leaderboard = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // TÍNH TOÁN ĐIỂM
            foreach ($leaderboard as &$user) {
                // 1. Số liệu task
                $doneOnTime = (int)$user['done_on_time'];
                $doneLate = (int)$user['done_late'];
                $overdueNotDone = (int)$user['overdue_not_done'];
                
                // 2. Số liệu đánh giá tháng (Thực tế mỗi người sẽ chỉ có 1 đánh giá, nên biến này sẽ là 1 hoặc 0)
                $star = (int)$user['star_count'];
                $like = (int)$user['like_count'];
                $dislike = (int)$user['dislike_count'];
                
                // 3. Áp dụng Công thức tính điểm
                // Task đúng hạn (+10), Task trễ hạn (+5), Task đang trễ phạt (-5)
                // Đánh giá Xuất sắc (+50), Tốt (+20), Kém phạt (-30)
                $user['score'] = ($doneOnTime * 10) + ($doneLate * 5) - ($overdueNotDone * 5) + ($star * 50) + ($like * 20) - ($dislike * 30);
                
                if ($user['score'] < 0) {
                    $user['score'] = 0; // Đáy là 0 điểm
                }
                
                // 4. Định dạng lại biến để hiển thị Giao diện cũ không bị lỗi
                // Giao diện list cần biến done_tasks và late_tasks
                $user['done_tasks'] = $doneOnTime + $doneLate; 
                $user['late_tasks'] = $doneLate + $overdueNotDone;
                
                if (empty($user['department_name'])) {
                    $user['department_name'] = 'Chưa phân bổ';
                }
            }

            // Sắp xếp xếp hạng: Ai điểm cao hơn thì đứng trên
            usort($leaderboard, function($a, $b) {
                return $b['score'] <=> $a['score'];
            });

            sendSuccess(['data' => $leaderboard]);
            
        } catch (Exception $e) {
            sendError("Lỗi SQL: " . $e->getMessage());
        }
        break;

    // ==========================================
    // MODULE LẤY CHI TIẾT NĂNG SUẤT 1 NHÂN VIÊN
    // ==========================================
   case 'fetch_user_ranking_details':
        $userId = $params['user_id'] ?? 0;
        
        try {
            // 1. Thống kê Task: Xong đúng hạn / Xong trễ hạn
            $stmtTask = $pdo->prepare("
                SELECT 
                    SUM(CASE WHEN status = 3 AND (isOverdue = 0 OR isOverdue IS NULL) THEN 1 ELSE 0 END) as done_on_time,
                    SUM(CASE WHEN status = 3 AND isOverdue = 1 THEN 1 ELSE 0 END) as done_late
                FROM tasks 
                WHERE assigneeId = ?
            ");
            $stmtTask->execute([$userId]);
            $taskStats = $stmtTask->fetch(PDO::FETCH_ASSOC);

            // 2. Thống kê Đánh giá: Lấy trực tiếp từ bảng evaluations qua staff_id
            $evalData = [];
            $totalEvals = 0;
            
            try {
                // Truy vấn đúng cột 'type' và 'staff_id' theo hình bạn cung cấp
                $stmtEval = $pdo->prepare("
                    SELECT e.type, COUNT(e.id) as cnt 
                    FROM evaluations e 
                    WHERE e.staff_id = ? 
                    GROUP BY e.type
                ");
                $stmtEval->execute([$userId]);
                $evals = $stmtEval->fetchAll(PDO::FETCH_ASSOC);
                
                // Cấu hình khung hiển thị mặc định (để nếu họ chưa có điểm vẫn hiện số 0)
                $evalData = ['Xuất sắc' => 0, 'Tốt' => 0, 'Kém' => 0];

                // Từ điển dịch từ mã Database sang Tiếng Việt cho Giao diện
                $typeMapping = [
                    'STAR' => 'Xuất sắc',
                    'LIKE' => 'Tốt',
                    'DISLIKE' => 'Kém'
                ];

                foreach ($evals as $row) {
                    $rawType = trim($row['type']);
                    
                    // Dịch mã tiếng Anh sang Tiếng Việt
                    $mappedType = $typeMapping[$rawType] ?? $rawType; 
                    
                    if (!empty($mappedType)) {
                        // Cộng dồn dữ liệu vào mảng
                        if (isset($evalData[$mappedType])) {
                            $evalData[$mappedType] += (int)$row['cnt'];
                        } else {
                            $evalData[$mappedType] = (int)$row['cnt'];
                        }
                        $totalEvals += (int)$row['cnt'];
                    }
                }
            } catch (Exception $e) {
                // Nếu vẫn lỗi, trả về -1 để báo cho JS
                $totalEvals = -1; 
                $evalData = ['error' => $e->getMessage()];
            }

            sendSuccess([
                'on_time' => (int)$taskStats['done_on_time'],
                'late' => (int)$taskStats['done_late'],
                'evals' => $evalData,
                'total_evals' => $totalEvals
            ]);
            
        } catch (Exception $e) {
            sendError("Lỗi hệ thống: " . $e->getMessage());
        }
        break;

    // ==========================================
    // MODULE SỰ KIỆN 
    // ==========================================
    case 'create_event':
        try {
            // Lấy dữ liệu từ $params
            $title = isset($params['title']) ? trim($params['title']) : '';
            $start = isset($params['start_datetime']) ? trim($params['start_datetime']) : '';
            $end = isset($params['end_datetime']) ? trim($params['end_datetime']) : '';
            $type = isset($params['notify_type']) ? trim($params['notify_type']) : 'ALL';
            $content = isset($params['content']) ? trim($params['content']) : '';
            
            // ID người tạo lấy chuẩn từ $_SESSION['user']['id']
            $sender_id = isset($_SESSION['user']['id']) ? (int)$_SESSION['user']['id'] : 1; 
            
            // Xử lý mảng user
            $notify_users = '[]';
            if (isset($params['notify_users']) && is_array($params['notify_users'])) {
                $notify_users = json_encode($params['notify_users']);
            }

            if (empty($title) || empty($start)) {
                sendError('Vui lòng nhập đầy đủ tên sự kiện và ngày bắt đầu!');
            }

            // Dùng Prepare Statement của PDO để thêm dữ liệu (Cực kỳ an toàn, chống hack)
            $sql = "INSERT INTO company_events (title, start_datetime, end_datetime, notify_type, notify_users, content, created_by, created_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
            $stmt = $pdo->prepare($sql);
            
            if ($stmt->execute([$title, $start, $end, $type, $notify_users, $content, $sender_id])) {
                $event_id = $pdo->lastInsertId(); // Hàm chuẩn của PDO
                
                // --- LOGIC BẮN THÔNG BÁO ---
                $time_str = date('H:i d/m', strtotime($start));
                $message = "Bạn có một sự kiện mới: " . $title . " vào lúc " . $time_str;
                $noti_type = "NEW_EVENT"; 
                
                $pusher_receivers = []; // Mảng gom ID người nhận cho Pusher
                
                if ($type === 'ALL') {
                    $u_stmt = $pdo->query("SELECT id FROM users WHERE active = 1");
                    $users = $u_stmt->fetchAll();
                    
                    foreach ($users as $u) {
                        $uid = $u['id'];
                        $n_stmt = $pdo->prepare("INSERT INTO notifications (user_id, sender_id, message, type, related_id) VALUES (?, ?, ?, ?, ?)");
                        $n_stmt->execute([$uid, $sender_id, $message, $noti_type, $event_id]);
                        
                        $pusher_receivers[] = (int)$uid; // Nhét vào mảng
                    }
                } else {
                    if (isset($params['notify_users']) && is_array($params['notify_users'])) {
                        foreach($params['notify_users'] as $uid) {
                            $uid = (int)$uid;
                            $n_stmt = $pdo->prepare("INSERT INTO notifications (user_id, sender_id, message, type, related_id) VALUES (?, ?, ?, ?, ?)");
                            $n_stmt->execute([$uid, $sender_id, $message, $noti_type, $event_id]);
                            
                            $pusher_receivers[] = $uid; // Nhét vào mảng
                        }
                    }
                }
                
                // BẮN PUSHER CHO TẤT CẢ NHỮNG NGƯỜI VỪA ĐƯỢC NHẬN THÔNG BÁO SỰ KIỆN
                triggerPusher($pusher_receivers);
                
                // Dùng hàm Helper có sẵn của bạn để trả về thành công
                sendSuccess(['message' => 'Tạo sự kiện thành công!']);
            } else {
                sendError('Không thể lưu sự kiện vào Database.');
            }
        } catch (PDOException $e) {
            sendError('Lỗi SQL: ' . $e->getMessage());
        } catch (Exception $e) {
            sendError('Lỗi Backend: ' . $e->getMessage());
        }
        break;

    case 'get_events_for_calendar':
        try {
            // 1. Lấy sự kiện công ty
            $stmtEvents = $pdo->query("SELECT id, title, start_datetime, end_datetime, 'EVENT' as type FROM company_events");
            $events = $stmtEvents->fetchAll();
            
            $calendarData = [];
            foreach ($events as $e) {
                $calendarData[] = [
                    'id'             => $e['id'],
                    'title'          => $e['title'],
                    'start_datetime' => $e['start_datetime'],
                    'end_datetime'   => $e['end_datetime'],
                    'type'           => 'EVENT',
                    'color'          => '#4f46e5'
                ];
            }

            // 2. Lấy đơn nghỉ phép (HIỂN THỊ CẢ PENDING VÀ APPROVED CHO TẤT CẢ MỌI NGƯỜI)
            $myId = $_SESSION['user']['id'];
            $likeStr = '%"' . $myId . '"%'; 
            
            // [ĐÃ SỬA LỖI] Thêm 'PENDING' vào điều kiện IN để mọi người đều thấy có người đang xin nghỉ
            $stmtLeaves = $pdo->prepare("
                 SELECT l.id, u.fullName, l.start_date, l.end_date, l.leave_type, l.status 
                 FROM leave_requests l JOIN users u ON l.user_id = u.id 
                 WHERE l.status IN ('APPROVED', 'PENDING') 
                    OR l.user_id = ? 
                    OR l.manager_id = ? 
                    OR l.followers LIKE ?
            ");
            $stmtLeaves->execute([$myId, $myId, $likeStr]);
            $leaves = $stmtLeaves->fetchAll();

            foreach ($leaves as $l) {
                $isPending = ($l['status'] === 'PENDING');
                $isRejected = ($l['status'] === 'REJECTED'); 
                
                if ($isRejected) {
                    $titlePrefix = "Từ chối nghỉ phép: ";
                    $color = '#ef4444'; // Màu đỏ
                } else if ($isPending) {
                    $titlePrefix = "Chờ duyệt nghỉ phép: ";
                    $color = '#f59e0b'; // Màu cam
                } else {
                    $titlePrefix = "Nghỉ phép: ";
                    $color = '#10b981'; // Màu xanh lá
                }

                $calendarData[] = [
                    'id'             => $l['id'],
                    'title'          => $titlePrefix.$l['fullName'], // Vẫn giữ nguyên hiển thị cực ngắn theo ý bạn
                    'start_datetime' => $l['start_date'] . ' 00:00:00',
                    'end_datetime'   => $l['end_date'] . ' 23:59:59',
                    'type'           => 'LEAVE',
                    'color'          => $color
                ];
            }

            sendSuccess(['data' => $calendarData]);
        } catch (Exception $e) {
            sendError('Lỗi lấy dữ liệu lịch: ' . $e->getMessage());
        }
        break;

        case 'get_schedule_detail':
        try {
            $id = (int)$params['id'];
            $type = $params['type']; // 'EVENT' hoặc 'LEAVE'
            $data = null;

            if ($type === 'EVENT') {
                $stmt = $pdo->prepare("SELECT e.title, e.start_datetime, e.end_datetime, e.content, u.fullName as creator_name 
                                       FROM company_events e LEFT JOIN users u ON e.created_by = u.id WHERE e.id = ?");
                $stmt->execute([$id]);
                $row = $stmt->fetch();
                if ($row) {
                    $data = [
                        'title' => $row['title'],
                        'start_time' => date('H:i d/m/Y', strtotime($row['start_datetime'])),
                        'end_time' => date('H:i d/m/Y', strtotime($row['end_datetime'])),
                        'content' => $row['content'],
                        'creator_name' => $row['creator_name']
                    ];
                }
            } elseif ($type === 'LEAVE') {
                $stmt = $pdo->prepare("SELECT l.*, u.fullName as requester_name, m.fullName as manager_name FROM leave_requests l JOIN users u ON l.user_id = u.id LEFT JOIN users m ON l.manager_id = m.id WHERE l.id = ?");
                $stmt->execute([$id]);
                $row = $stmt->fetch();
                
                if ($row) {
                    $myId = $_SESSION['user']['id'];
                    $myRole = $_SESSION['user']['role'];
                    
                    $followerNames = 'Không có';
                    $fIds = json_decode($row['followers'], true);
                    if (is_array($fIds) && count($fIds) > 0) {
                        $placeholders = implode(',', array_fill(0, count($fIds), '?'));
                        $fStmt = $pdo->prepare("SELECT fullName FROM users WHERE id IN ($placeholders)");
                        $fStmt->execute($fIds);
                        $followerNames = implode(', ', $fStmt->fetchAll(PDO::FETCH_COLUMN));
                    }
                    
                    $canSeePrivate = false;
                    if ($myRole === 'SUPER_ADMIN' || $myRole === 'ADMIN' || $myId == $row['user_id'] || $myId == $row['manager_id'] || (is_array($fIds) && in_array($myId, $fIds))) {
                        $canSeePrivate = true;
                    }

                    $data = [
                        'id' => $row['id'],
                        'status' => $row['status'],
                        'manager_id' => $row['manager_id'],
                        'title' => "ĐƠN XIN NGHỈ PHÉP",
                        'requester_name' => $row['requester_name'],
                        'start_time' => date('d/m/Y', strtotime($row['start_date'])),
                        'end_time' => date('d/m/Y', strtotime($row['end_date'])),
                        'content' => $canSeePrivate ? $row['reason'] : "", 
                        'manager_note' => $canSeePrivate ? $row['manager_note'] : "",
                        'has_permission' => $canSeePrivate, 
                        'creator_name' => $row['manager_name'] ?? 'Chưa duyệt',
                        'leave_type' => $row['leave_type'],
                        'followers_name' => $followerNames,
                        'created_at' => date('H:i d/m/Y', strtotime($row['created_at']))
                    ];
                }
            }
            if ($data) {
                sendSuccess(['data' => $data]);
            } else {
                sendError('Không tìm thấy dữ liệu');
            }
        } catch (Exception $e) {
            sendError('Lỗi Backend: ' . $e->getMessage());
        }
        break;

 // TẠO ĐƠN NGHỈ PHÉP
   case 'create_leave_request':
        try {
            $userId = $_SESSION['user']['id'];
            $startDate = $params['start_date'];
            $endDate = $params['end_date'];
            $reason = trim($params['reason']);
            $leaveType = $params['leave_type'] ?? 'PHÉP NĂM';
            $followers = isset($params['followers']) && is_array($params['followers']) ? json_encode($params['followers']) : '[]';
            
            // Lấy ID người duyệt từ Frontend
            $managerId = isset($params['manager_id']) ? (int)$params['manager_id'] : null;

            // Đã thêm điều kiện kiểm tra empty($managerId) để bắt buộc phải chọn sếp
            if (empty($startDate) || empty($endDate) || empty($reason) || empty($managerId)) {
                sendError('Vui lòng điền đầy đủ thông tin và chọn người duyệt!');
            }
            $stmt = $pdo->prepare("INSERT INTO leave_requests (user_id, start_date, end_date, reason, leave_type, status, manager_id, followers) VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?)");
            
            if ($stmt->execute([$userId, $startDate, $endDate, $reason, $leaveType, $managerId, $followers])) {
                $leaveId = $pdo->lastInsertId();
                $pusherReceivers = [];
                $msg = $_SESSION['user']['fullName'] . " vừa gửi đơn xin nghỉ phép mới.";

                // 1. Thông báo cho Quản lý (Người duyệt đã được chọn)
                $pdo->prepare("INSERT INTO notifications (user_id, sender_id, message, type, related_id) VALUES (?, ?, ?, 'LEAVE_REQUEST', ?)")->execute([$managerId, $userId, $msg, $leaveId]);
                $pusherReceivers[] = $managerId;

                // 2. Thông báo cho Người theo dõi
                if (!empty($params['followers'])) {
                    foreach ($params['followers'] as $fId) {
                        if ($fId != $managerId) { // Tránh gửi 2 lần nếu BGĐ cũng là Quản lý
                            $pdo->prepare("INSERT INTO notifications (user_id, sender_id, message, type, related_id) VALUES (?, ?, ?, 'LEAVE_REQUEST', ?)")->execute([$fId, $userId, $msg, $leaveId]);
                            $pusherReceivers[] = (int)$fId;
                        }
                    }
                }

                if (!empty($pusherReceivers)) triggerPusher($pusherReceivers);
                sendSuccess(['message' => 'Gửi đơn thành công, vui lòng chờ duyệt!']);
            }
        } catch (Exception $e) { sendError($e->getMessage()); }
        break;

    // 2. Chỉnh sửa đơn nghỉ phép (Chỉ khi đang PENDING)
    case 'update_leave_request':
        try {
            $leaveId = (int)$params['id'];
            $userId = $_SESSION['user']['id'];
            
            // Kiểm tra xem đơn có phải của mình và còn đang chờ duyệt không
            $check = $pdo->prepare("SELECT status FROM leave_requests WHERE id = ? AND user_id = ?");
            $check->execute([$leaveId, $userId]);
            $current = $check->fetch();

            if (!$current) sendError('Không tìm thấy đơn hoặc bạn không có quyền sửa.');
            if ($current['status'] !== 'PENDING') sendError('Đơn đã được xử lý, không thể chỉnh sửa.');

            $sql = "UPDATE leave_requests SET start_date = ?, end_date = ?, reason = ?, leave_type = ? WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$params['start_date'], $params['end_date'], trim($params['reason']), $params['leave_type'], $leaveId]);

            sendSuccess(['message' => 'Cập nhật đơn nghỉ phép thành công!']);
        } catch (Exception $e) { sendError($e->getMessage()); }
        break;

    // 3. Duyệt đơn nghỉ phép (Dành cho Quản lý)
   case 'approve_leave_request':
        try {
            $leaveId = (int)$params['id'];
            $status = $params['status']; 
            
            // [ĐÃ SỬA] Lấy nội dung ghi chú từ Frontend gửi lên
            $managerNote = trim($params['manager_note'] ?? ''); 
            
            $managerId = $_SESSION['user']['id'];

            // [ĐÃ SỬA] Thêm manager_note vào câu lệnh SQL
            $stmt = $pdo->prepare("UPDATE leave_requests SET status = ?, manager_id = ?, manager_note = ?, updated_at = NOW() WHERE id = ?");
            if ($stmt->execute([$status, $managerId, $managerNote, $leaveId])) {
                
                $stmtInfo = $pdo->prepare("SELECT user_id, followers FROM leave_requests WHERE id = ?");
                $stmtInfo->execute([$leaveId]);
                $req = $stmtInfo->fetch();

                if ($req) {
                    $targetUid = (int)$req['user_id'];
                    $statusText = ($status === 'APPROVED') ? 'ĐƯỢC DUYỆT' : 'BỊ TỪ CHỐI';
                    $msg = "Đơn nghỉ phép của " . $_SESSION['user']['fullName'] . " đã $statusText.";
                    
                    $pusherReceivers = [$targetUid];
                    
                    // Báo cho người làm đơn
                    $pdo->prepare("INSERT INTO notifications (user_id, sender_id, message, type, related_id) VALUES (?, ?, ?, 'LEAVE_RESPONSE', ?)")->execute([$targetUid, $managerId, "Đơn nghỉ phép của bạn đã $statusText.", $leaveId]);

                    // Báo cho người theo dõi
                    $fIds = json_decode($req['followers'], true);
                    if (is_array($fIds)) {
                        foreach ($fIds as $fId) {
                            $pdo->prepare("INSERT INTO notifications (user_id, sender_id, message, type, related_id) VALUES (?, ?, ?, 'LEAVE_RESPONSE', ?)")->execute([$fId, $managerId, $msg, $leaveId]);
                            $pusherReceivers[] = (int)$fId;
                        }
                    }
                    
                    triggerPusher($pusherReceivers);
                }
                sendSuccess(['message' => 'Đã xử lý đơn!']);
            }
        } catch (Exception $e) { sendError($e->getMessage()); }
        break;
}
?>