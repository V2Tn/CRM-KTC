<div class="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 font-['Lexend']">
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
            <h2 class="text-3xl font-black text-slate-900 tracking-tight uppercase" id="team-page-title">Tổng quan đội nhóm</h2>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5" id="team-page-subtitle">Sơ đồ tổ chức & Hiệu suất</p>
        </div>
        <div class="flex items-center gap-4">
            <button id="btn-team-back" onclick="TeamController.goBack()" class="hidden flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                <i data-lucide="arrow-left" width="16"></i> Quay lại
            </button>
            <div class="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm">
                <i data-lucide="calendar" width="16" class="ml-2 text-indigo-500"></i>
                <select id="team-date-filter" onchange="TeamController.changeFilter()" class="bg-transparent text-[11px] font-bold uppercase text-slate-700 outline-none p-1.5 cursor-pointer min-w-[120px]">
                    <option value="0" selected>Hôm nay</option>
                    <option value="7">7 ngày qua</option>
                    <option value="14">14 ngày qua</option>
                    <option value="30">30 ngày qua</option>
                </select>
            </div>
        </div>
    </div>

    <?php include 'Departments.php'; ?>
    <?php include 'Dept_detail.php'; ?>
    <?php include 'Member_detail.php'; ?>
</div>

<?php include 'Rating_modal.php'; ?>
