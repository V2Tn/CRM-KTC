<?php
// public_html/db_config.php

// 1. THÔNG TIN KẾT NỐI DATABASE
// Bạn cần thay đổi các thông số bên dưới cho đúng với hosting của bạn
define('DB_HOST', 'localhost');
define('DB_NAME', 'daicatta6946_task'); // Tên Database bạn đã tạo
define('DB_USER', 'daicatta6946_task'); // Tên User quản lý Database
define('DB_PASS', 'rcgL2g7Tac7VctknYxWk'); // Mật khẩu của User Database

try {
    // 2. TẠO KẾT NỐI PDO
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Báo lỗi chi tiết
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Lấy dữ liệu dạng mảng kết hợp
        PDO::ATTR_EMULATE_PREPARES   => false,                  // Bảo mật hơn
    ];
    
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    
} catch (PDOException $e) {
    // Nếu lỗi kết nối thì dừng và báo lỗi
    die("Lỗi kết nối Database: " . $e->getMessage());
}
?>