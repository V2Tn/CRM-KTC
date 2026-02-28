<?php
// 1. TÍNH TOÁN DỮ LIỆU TỪ DANH SÁCH TASK ($tasks được truyền từ App.php)
$stats = [
    'done' => 0,
    'doing' => 0,
    'pending' => 0,
    'cancelled' => 0,
    'backlog' => 0,
    'total' => 0
];

if (isset($tasks) && is_array($tasks)) {
    $now = new DateTime();
    $stats['total'] = count($tasks);

    foreach ($tasks as $t) {
        $status = intval($t['status'] ?? 1); // Sử dụng ID trạng thái (1, 2, 3, 4) để đồng bộ với DB
        
        // Phân loại trạng thái
        if ($status === 3) { // Hoàn thành
            $stats['done']++;
        } elseif ($status === 2) { // Đang làm
            $stats['doing']++;
        } elseif ($status === 4 || $status === 0) { // Hủy
            $stats['cancelled']++;
        } else { // Mới (1)
            $stats['pending']++;
        }

        // Kiểm tra Backlog (isOverdue từ DB hoặc tính toán)
        $isOverdue = (isset($t['isOverdue']) && $t['isOverdue'] == 1);
        if ($isOverdue && $status !== 3 && $status !== 4) {
            $stats['backlog']++;
        }
    }
}

// 2. Gán biến để render HTML lần đầu
$done = $stats['done'];
$doing = $stats['doing'];
$pending = $stats['pending'];
$cancelled = $stats['cancelled'];
$backlog = $stats['backlog'];
$total = $stats['total'];

// 3. Tính toán SVG Circle Progress
$percentage = $total > 0 ? round(($done / $total) * 100) : 0;
$radius = 35;
$circumference = 2 * pi() * $radius;
$offset = $circumference - ($percentage / 100) * $circumference;
?>

<div class="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-gray-100 group hover:shadow-md transition-all duration-300 w-full font-['Lexend']">
  <h4 class="font-extrabold text-[#475569] text-[11px] md:text-[13px] uppercase tracking-[0.1em] mb-6 md:mb-8 pl-1 flex items-center gap-2">
    <i data-lucide="activity" width="16" class="text-indigo-500"></i>
    TIẾN ĐỘ HÔM NAY
  </h4>
  
  <div class="flex flex-col sm:flex-row items-center gap-6 md:gap-8">
    
    <div class="relative w-24 h-24 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 80 80" class="w-24 h-24 transform -rotate-90">
        <circle
          cx="40" cy="40" r="<?php echo $radius; ?>"
          stroke="currentColor" stroke-width="7" fill="transparent"
          class="text-slate-100"
        />
        <circle
          id="progress-circle-svg"
          cx="40" cy="40" r="<?php echo $radius; ?>"
          stroke="currentColor" stroke-width="7" fill="transparent"
          stroke-dasharray="<?php echo $circumference; ?>"
          stroke-dashoffset="<?php echo $offset; ?>"
          stroke-linecap="round"
          class="text-indigo-600 transition-all duration-1000 ease-out"
        />
      </svg>
      <span id="progress-percent-text" class="absolute text-xl font-black text-slate-800 tracking-tighter">
        <?php echo $percentage; ?>%
      </span>
    </div>
    
    <div class="grid grid-cols-2 gap-x-3 gap-y-3 flex-1 w-full">
      
      <div class="flex items-center gap-2 bg-[#f0fdf4] px-4 py-3 rounded-2xl border border-green-50 shadow-sm min-w-0 hover:bg-green-100 transition-colors">
        <span class="w-2 h-2 rounded-full bg-[#10b981] shrink-0"></span>
        <div class="flex items-center gap-2 min-w-0 overflow-hidden">
          <span id="stat-done-count" class="text-[15px] md:text-[16px] font-black text-[#1e293b] leading-none"><?php echo $done; ?></span>
          <span class="text-[8px] md:text-[9px] font-extrabold text-[#64748b] uppercase tracking-wider truncate">HOÀN THÀNH</span>
        </div>
      </div>

      <div class="flex items-center gap-2 bg-[#f5f3ff] px-4 py-3 rounded-2xl border border-indigo-50 shadow-sm min-w-0 hover:bg-indigo-100 transition-colors">
        <span class="w-2 h-2 rounded-full bg-[#6366f1] animate-pulse shrink-0"></span>
        <div class="flex items-center gap-2 min-w-0 overflow-hidden">
          <span id="stat-doing-count" class="text-[15px] md:text-[16px] font-black text-[#1e293b] leading-none"><?php echo $doing; ?></span>
          <span class="text-[8px] md:text-[9px] font-extrabold text-[#64748b] uppercase tracking-wider truncate">ĐANG LÀM</span>
        </div>
      </div>

      <div class="flex items-center gap-2 bg-[#fef2f2] px-4 py-3 rounded-2xl border border-red-50 shadow-sm min-w-0 hover:bg-red-100 transition-colors">
        <span class="w-2 h-2 rounded-full bg-[#ef4444] shrink-0"></span>
        <div class="flex items-center gap-2 min-w-0 overflow-hidden">
          <span id="stat-overdue-count" class="text-[15px] md:text-[16px] font-black text-[#1e293b] leading-none"><?php echo $backlog; ?></span>
          <span class="text-[8px] md:text-[9px] font-extrabold text-[#64748b] uppercase tracking-wider truncate">TỒN ĐỌNG</span>
        </div>
      </div>

      <div class="flex items-center gap-2 bg-[#eff6ff] px-4 py-3 rounded-2xl border border-blue-50 shadow-sm min-w-0 hover:bg-blue-100 transition-colors">
        <span class="w-2 h-2 rounded-full bg-[#3b82f6] shrink-0"></span>
        <div class="flex items-center gap-2 min-w-0 overflow-hidden">
          <span id="stat-new-count" class="text-[15px] md:text-[16px] font-black text-[#1e293b] leading-none"><?php echo $pending; ?></span>
          <span class="text-[8px] md:text-[9px] font-extrabold text-[#64748b] uppercase tracking-wider truncate">MỚI</span>
        </div>
      </div>

      <div class="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100 shadow-sm min-w-0 hover:bg-gray-100 transition-colors col-span-2">
        <span class="w-2 h-2 rounded-full bg-gray-400 shrink-0"></span>
        <div class="flex items-center gap-2 min-w-0 overflow-hidden">
          <span id="stat-cancel-count" class="text-[15px] md:text-[16px] font-black text-[#1e293b] leading-none"><?php echo $cancelled; ?></span>
          <span class="text-[8px] md:text-[9px] font-extrabold text-[#64748b] uppercase tracking-wider truncate">HỦY</span>
        </div>
      </div>

    </div>
  </div>
</div>