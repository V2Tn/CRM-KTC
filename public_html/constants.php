<?php
// constants.php

// 1. Cấu hình Ma trận Eisenhower (Quadrant Config)
// Dùng để render giao diện, màu sắc các ô
$QUADRANT_CONFIG = [
    'do_first' => [ // Tương ứng Q1
        'id' => 'do_first',
        'title' => 'LÀM NGAY',
        'description' => 'Quan trọng & Khẩn cấp',
        'borderColor' => 'border-rose-100',
        'bgColor' => 'bg-[#fffafa]',
        'headerBg' => 'bg-rose-50',
        'headerColor' => 'text-rose-700',
        'accentColor' => 'bg-rose-500',
        'badgeColor' => 'bg-rose-100 text-rose-700',
    ],
    'schedule' => [ // Tương ứng Q2
        'id' => 'schedule',
        'title' => 'LÊN LỊCH',
        'description' => 'Quan trọng & Không khẩn cấp',
        'borderColor' => 'border-sky-100',
        'bgColor' => 'bg-[#fcfdff]',
        'headerBg' => 'bg-sky-50',
        'headerColor' => 'text-sky-700',
        'accentColor' => 'bg-sky-500',
        'badgeColor' => 'bg-sky-100 text-sky-700',
    ],
    'delegate' => [ // Tương ứng Q3
        'id' => 'delegate',
        'title' => 'GIAO VIỆC',
        'description' => 'Không quan trọng & Khẩn cấp',
        'borderColor' => 'border-indigo-100',
        'bgColor' => 'bg-[#fafafe]',
        'headerBg' => 'bg-indigo-50',
        'headerColor' => 'text-indigo-700',
        'accentColor' => 'bg-indigo-500',
        'badgeColor' => 'bg-indigo-100 text-indigo-700',
    ],
    'eliminate' => [ // Tương ứng Q4
        'id' => 'eliminate',
        'title' => 'LOẠI BỎ',
        'description' => 'Không quan trọng & Không khẩn cấp',
        'borderColor' => 'border-slate-200',
        'bgColor' => 'bg-[#f9fafb]',
        'headerBg' => 'bg-slate-100',
        'headerColor' => 'text-slate-700',
        'accentColor' => 'bg-slate-500',
        'badgeColor' => 'bg-slate-200 text-slate-700',
    ],
];

// 2. Cấu hình Âm thanh
$SOUND_CONFIG = [
    'TASK_DONE' => 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
    'VOLUME' => 0.5
];
?>