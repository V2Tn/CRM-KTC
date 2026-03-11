<?php
// Bật báo lỗi để dễ debug (Tắt đi khi chạy chính thức)
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);
session_start();
// Load cấu hình chung
require_once 'constants.php';
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kim Tâm Cát</title>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="icon" type="image/png" href="uploads/logo.png">
    <link rel="apple-touch-icon" href="uploads/logo.png">
    <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;700;900&display=swap" rel="stylesheet">
    
    <script src="https://unpkg.com/lucide@latest"></script>
    
    <style>
        /* Font chữ mặc định */
        body { font-family: 'Lexend', sans-serif; }
        
        /* QUAN TRỌNG: Class này giúp ẩn Login/Dashboard đúng logic */
        .hidden { display: none !important; }
        
        /* Ẩn thanh cuộn */
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Loading spinner */
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    </style>
</head>
<body class="bg-[#f8fafc] text-slate-800">
    
    <div id="root" class="min-h-screen">
        <?php include 'App.php'; ?>
    </div>
<script src="https://js.pusher.com/8.2.0/pusher.min.js"></script>
<script src="controller/utils-min.js?v=<?php echo filemtime('controller/utils-min.js'); ?>"></script>
<script src="controller/notification-min.js?v=<?php echo filemtime('controller/notification-min.js'); ?>"></script>
<script src="controller/profile-min.js?v=<?php echo filemtime('controller/profile-min.js'); ?>"></script>
<script src="controller/ui-min.js?v=<?php echo filemtime('controller/ui-min.js'); ?>"></script>
<script src="controller/auth-min.js?v=<?php echo filemtime('controller/auth-min.js'); ?>"></script>
<script src="controller/ranking-min.js?v=<?php echo filemtime('controller/ranking-min.js'); ?>"></script>
<script src="controller/schedule-min.js?v=<?php echo filemtime('controller/schedule-min.js'); ?>"></script>
<script src="controller/reports-min.js?v=<?php echo filemtime('controller/reports-min.js'); ?>"></script>
<script src="service/team/Departments-min.js?v=<?php echo filemtime('service/team/Departments-min.js'); ?>"></script>
<script src="service/team/DeptDetail-min.js?v=<?php echo filemtime('service/team/DeptDetail-min.js'); ?>"></script>
<script src="service/team/MemberDetail-min.js?v=<?php echo filemtime('service/team/MemberDetail-min.js'); ?>"></script>
<script src="controller/team-min.js?v=<?php echo filemtime('controller/team-min.js'); ?>"></script>
<script type="module" src="controller/tasks-min.js?v=<?php echo filemtime('controller/tasks-min.js'); ?>"></script> 
<script type="module" src="controller/staff-min.js?v=<?php echo filemtime('controller/staff-min.js'); ?>"></script>
<script type="module" src="controller/department-min.js?v=<?php echo filemtime('controller/department-min.js'); ?>"></script>

<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            if(window.lucide) lucide.createIcons();
            const urlParams = new URLSearchParams(window.location.search);
        // Nếu đang ở tab Đội nhóm, bắt đầu gọi hàm Init tải dữ liệu
        if (urlParams.get('tab') === 'team') {
            // Đợi thêm 100ms cho DOM của App.php bung ra hết rồi mới vẽ
            setTimeout(() => {
                if (typeof window.TeamController !== 'undefined') {
                    window.TeamController.init();
                }
            }, 100);
        }
        });
    </script>
</body>
</html>