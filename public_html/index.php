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
<script src="js/controller/utils.js"></script>
<script src="js/controller/notification.controller.js"></script>
<script src="js/controller/profile.controller.js"></script>
<script src="js/controller/ui.controller.js"></script>
<script src="js/controller/auth.controller.js"></script>
<script src="js/controller/ranking.controller.js"></script>
<script src="js/controller/schedule.controller.js"></script>
<script src="js/controller/reports.controller.js"></script>
<script src="js/service/team/Departments.js"></script>
<script src="js/service/team/DeptDetail.js"></script>
<script src="js/service/team/MemberDetail.js"></script>
<script src="js/controller/team.controller.js"></script>
<script type="module" src="js/controller/tasks.controller.js"></script> 
<script type="module" src="js/controller/staff.controller.js"></script>
<script type="module" src="js/controller/department.controller.js"></script>

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