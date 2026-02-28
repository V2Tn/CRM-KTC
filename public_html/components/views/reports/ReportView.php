<style>
    .report-read-only button[onclick*="updateStatus"],
    .report-read-only button[onclick*="enableEditMode"] {
        display: none !important;
    }
    .report-read-only .group { cursor: default !important; }
</style>

<div class="flex flex-col gap-6 w-full max-w-[1200px] mx-auto pb-12 px-1 font-['Lexend']">
    
    <div class="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-fit self-start mb-2 overflow-hidden">
        <button onclick="ReportController.loadReport('today')" class="period-btn px-5 py-2 text-sm font-black rounded-xl transition-all">Hôm nay</button>
        <button onclick="ReportController.loadReport('week')" class="period-btn px-5 py-2 text-sm font-black rounded-xl transition-all">Tuần</button>
        <button onclick="ReportController.loadReport('month')" class="period-btn px-5 py-2 text-sm font-black rounded-xl transition-all">Tháng</button>
        <button onclick="ReportController.loadReport('year')" class="period-btn px-5 py-2 text-sm font-black rounded-xl transition-all">Năm</button>
    </div>

    <div class="grid grid-cols-1 <?php echo ($currentUser['role'] !== 'STAFF') ? 'md:grid-cols-2' : ''; ?> gap-6">
        <div class="relative bg-gradient-to-br from-[#1e1b4b] to-[#4338ca] rounded-[40px] p-10 text-white overflow-hidden shadow-2xl shadow-indigo-100">
            <div class="relative z-10">
                <p class="text-[11px] font-black opacity-60 uppercase tracking-widest mb-3">Hiệu suất cá nhân</p>
                <div class="flex items-baseline gap-3">
                    <span id="my-done-count" class="text-6xl font-[1000] tracking-tighter leading-none">0</span>
                    <span class="text-sm font-bold opacity-40 uppercase">/ <span id="my-total-count">0</span> CÔNG VIỆC HOÀN THÀNH</span>
                </div>
            </div>
            <div class="absolute right-[-10px] bottom-[-10px] opacity-[0.05]"><i data-lucide="award" width="150" height="150"></i></div>
        </div>

        <?php if ($currentUser['role'] !== 'STAFF'): ?>
        <div class="relative bg-white rounded-[40px] p-10 text-slate-800 border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div class="relative z-10">
                <p class="text-[11px] font-black text-indigo-500 uppercase tracking-widest mb-3">Quản lý giao việc</p>
                <div class="flex items-baseline gap-3">
                    <span id="assign-done-count" class="text-6xl font-[1000] text-slate-900 tracking-tighter leading-none">0</span>
                    <span class="text-sm font-bold text-slate-400 uppercase">/ <span id="assign-total-count">0</span> CÔNG VIỆC HOÀN THÀNH</span>
                </div>
            </div>
            <div class="absolute right-[-10px] bottom-[-10px] opacity-[0.03] text-indigo-900"><i data-lucide="send" width="150" height="150"></i></div>
        </div>
        <?php endif; ?>
    </div>

    <div class="bg-white rounded-[48px] p-10 md:p-14 border border-slate-50 shadow-sm relative overflow-hidden">
        <div class="flex justify-between items-start mb-10">
            <div>
                <h3 class="text-2xl font-black text-slate-900 uppercase">Biểu đồ tiến độ</h3>
                <p id="period-sub-label" class="text-[11px] font-black text-indigo-500 uppercase tracking-widest mt-2">Dữ liệu hệ thống</p>
            </div>
        </div>
        <div class="w-full overflow-x-auto scrollbar-hide pb-4">
            <div id="chart-bars-container" class="h-64 flex items-end justify-between gap-3 min-w-[800px] md:min-w-full"></div>
        </div>
        <div id="chart-tooltip" class="fixed pointer-events-none opacity-0 transition-opacity duration-150 z-[9999] hidden"></div>
    </div>

    <div class="mt-8">
        <div class="flex items-center justify-between mb-8 px-4">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm"><i data-lucide="clipboard-list" width="24"></i></div>
                <h3 class="text-xl font-black text-slate-800 uppercase tracking-tight">Lịch sử hoạt động</h3>
            </div>
            
            <?php if ($currentUser['role'] !== 'STAFF'): ?>
            <div class="flex bg-slate-100 p-1 rounded-xl">
                 <button onclick="ReportController.switchDiary('my')" id="btn-diary-my" class="px-4 py-2 text-[10px] font-black rounded-lg transition-all">CÔNG VIỆC TÔI LÀM</button>
                 <button onclick="ReportController.switchDiary('assign')" id="btn-diary-assign" class="px-4 py-2 text-[10px] font-black rounded-lg transition-all">CÔNG VIỆC TÔI GIAO</button>
            </div>
            <?php endif; ?>
        </div>
        <div id="diary-container" class="space-y-4"></div>
    </div>
</div>