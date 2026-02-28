<?php
// Danh sách các mẹo ngẫu nhiên để hiển thị thay đổi mỗi lần load
$randomTips = [
    "Đừng để Q3 (Giao việc) đánh lừa bạn rằng chúng quan trọng.",
    "Mạnh dạn loại bỏ Q4 (Giải trí vô bổ) để có thêm thời gian cho bản thân.",
    "Q2 là 'Vùng chất lượng'. Hãy dành 60% thời gian của bạn ở đây.",
    "Nếu một việc tốn dưới 2 phút để làm, hãy làm nó ngay lập tức!",
    "Đa nhiệm (Multitasking) làm giảm hiệu suất. Hãy tập trung làm từng việc một."
];

// Lấy ngẫu nhiên 1 key
$tipOfTheDay = $randomTips[array_rand($randomTips)];
?>

<div class="bg-sky-50/50 rounded-[32px] p-6 border border-sky-100/80 relative overflow-hidden group font-['Lexend'] mt-4">
    
    <div class="absolute -top-6 -right-6 w-24 h-24 bg-sky-200/20 rounded-full blur-2xl group-hover:bg-sky-300/30 transition-all"></div>

    <div class="relative z-10">
        <div class="flex items-center gap-2 mb-3">
            <div class="p-1.5 bg-sky-100 text-sky-600 rounded-lg">
                <i data-lucide="lightbulb" width="16" stroke-width="2.5"></i>
            </div>
            <h4 class="text-sm font-black text-sky-800 uppercase tracking-wide">Mẹo Eisenhower</h4>
        </div>

        <ul class="text-xs font-medium text-sky-700/80 space-y-2.5 leading-relaxed mb-4">
            <li class="flex items-start gap-2.5">
                <span class="mt-1.5 block w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0"></span>
                <span>Ưu tiên xử lý ô <b class="text-sky-900">Q1: Làm ngay</b> để dập tắt khủng hoảng.</span>
            </li>
            <li class="flex items-start gap-2.5">
                <span class="mt-1.5 block w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0"></span>
                <span>Tập trung tối đa vào <b class="text-sky-900">Q2: Lên lịch</b> để phát triển dài hạn.</span>
            </li>
        </ul>

        <div class="pt-3 border-t border-sky-100">
            <p class="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-1">Mách nhỏ hôm nay:</p>
            <p class="text-xs font-bold text-sky-600 italic">"<?php echo $tipOfTheDay; ?>"</p>
        </div>
    </div>
</div>