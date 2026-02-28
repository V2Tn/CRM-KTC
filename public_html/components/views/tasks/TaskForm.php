<?php
// FILE: TaskForm.php
date_default_timezone_set('Asia/Ho_Chi_Minh');
$nowVal = date('Y-m-d\TH:i');
$endVal = date('Y-m-d\T23:59');
$currentUserJson = json_encode($_SESSION['user'] ?? null);

$userRole = $_SESSION['user']['role'] ?? 'STAFF';
?>

<div class="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 font-['Lexend']">
    <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-black text-slate-800 uppercase tracking-wide">Thêm công việc mới</h3>
        <button type="button" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors">
            <i data-lucide="plus" width="18"></i>
        </button>
    </div>

    <form id="createTaskForm">
        <div class="mb-6">
            <input type="text" name="title" required class="w-full bg-gray-50 border-0 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 placeholder-gray-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all shadow-inner" placeholder="Bạn cần làm gì hôm nay?">
        </div>

        <div class="grid grid-cols-2 gap-3 mb-6">
            <label class="cursor-pointer relative group"><input type="radio" name="quadrant" value="do_first" checked class="peer sr-only"><div class="p-4 rounded-2xl border-2 border-transparent bg-rose-50 hover:bg-rose-100 peer-checked:border-rose-500 peer-checked:bg-white transition-all h-full"><div class="flex justify-between items-start"><div><p class="text-[13px] font-black text-rose-600 uppercase">Làm ngay</p><p class="text-[9px] font-bold text-rose-400 mt-1">QUAN TRỌNG & KHẨN CẤP</p></div><div class="w-2 h-2 rounded-full bg-rose-500 opacity-0 peer-checked:opacity-100"></div></div></div></label>
            <label class="cursor-pointer relative group"><input type="radio" name="quadrant" value="schedule" class="peer sr-only"><div class="p-4 rounded-2xl border-2 border-transparent bg-blue-50 hover:bg-blue-100 peer-checked:border-blue-500 peer-checked:bg-white transition-all h-full"><div class="flex justify-between items-start"><div><p class="text-[13px] font-black text-blue-600 uppercase">Lên lịch</p><p class="text-[9px] font-bold text-blue-400 mt-1">QUAN TRỌNG & KHÔNG GẤP</p></div><div class="w-2 h-2 rounded-full bg-blue-500 opacity-0 peer-checked:opacity-100"></div></div></div></label>
            <label class="cursor-pointer relative group"><input type="radio" name="quadrant" value="delegate" class="peer sr-only"><div class="p-4 rounded-2xl border-2 border-transparent bg-indigo-50 hover:bg-indigo-100 peer-checked:border-indigo-500 peer-checked:bg-white transition-all h-full"><div class="flex justify-between items-start"><div><p class="text-[13px] font-black text-indigo-600 uppercase">Giao việc</p><p class="text-[9px] font-bold text-indigo-400 mt-1">KHÔNG QUAN TRỌNG & GẤP</p></div><div class="w-2 h-2 rounded-full bg-indigo-500 opacity-0 peer-checked:opacity-100"></div></div></div></label>
            <label class="cursor-pointer relative group"><input type="radio" name="quadrant" value="eliminate" class="peer sr-only"><div class="p-4 rounded-2xl border-2 border-transparent bg-slate-50 hover:bg-slate-100 peer-checked:border-slate-500 peer-checked:bg-white transition-all h-full"><div class="flex justify-between items-start"><div><p class="text-[13px] font-black text-slate-600 uppercase">Loại bỏ</p><p class="text-[9px] font-bold text-slate-400 mt-1">KHÔNG QUAN TRỌNG & KHÔNG GẤP</p></div><div class="w-2 h-2 rounded-full bg-slate-500 opacity-0 peer-checked:opacity-100"></div></div></div></label>
        </div>

        <?php if ($userRole !== 'STAFF'): ?>
        <div class="relative mb-6" id="assign-toggle-wrapper">
            <label class="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 ml-1">Người thực hiện</label>
            
            <div id="assign-toggle-btn" class="flex items-center justify-between p-3.5 rounded-2xl border-2 border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 cursor-pointer transition-all group">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-white group-hover:border-indigo-400 transition-colors">
                        <i data-lucide="user-plus" class="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors"></i>
                    </div>
                    <span class="text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Giao việc cho người khác</span>
                </div>
                <i data-lucide="chevron-down" class="text-slate-400 transition-transform" id="assign-toggle-icon" width="16"></i>
            </div>
            
            <div id="assigneeSection" class="hidden absolute top-full left-0 w-full mt-2 z-[100] bg-white rounded-3xl shadow-xl border border-slate-100 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div class="relative mb-3">
                    <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" width="16"></i>
                    <input type="text" id="search-assignee" placeholder="Tìm theo tên nhân viên..." 
                           class="w-full bg-slate-50 border-0 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-slate-700 shadow-inner focus:ring-2 focus:ring-indigo-100 outline-none transition-all">
                </div>

                <div id="assignee-list-container" class="space-y-1 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                    <div class="text-center py-4 text-slate-400 text-[10px] font-black uppercase animate-pulse">Đang tải...</div>
                </div>
            </div>
            
            <input type="hidden" name="assignee_id" id="selected-assignee-id" value="">
        </div>
        <?php endif; ?>

        <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 ml-1">Bắt đầu</label>
                <input type="datetime-local" name="start_time" value="<?php echo $nowVal; ?>" class="w-full bg-gray-50 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 border-none focus:ring-2 focus:ring-indigo-100 outline-none shadow-inner">
            </div>
            <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 ml-1">Hết hạn</label>
                <input type="datetime-local" name="end_time" value="<?php echo $endVal; ?>" class="w-full bg-gray-50 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 border-none focus:ring-2 focus:ring-indigo-100 outline-none shadow-inner">
            </div>
        </div>

        <button type="submit" id="btn-create-task" class="w-full bg-[#f43f5e] hover:bg-[#e11d48] text-white rounded-2xl py-4 font-black uppercase tracking-widest text-xs shadow-lg shadow-rose-200 transition-all active:scale-[0.98]">
            <i data-lucide="plus" class="inline-block w-4 h-4 mr-1 -mt-0.5"></i> THÊM CÔNG VIỆC
        </button>
    </form>
</div>

<script>
    (function(){
        try {
            const phpUser = <?php echo $currentUserJson; ?>;
            if (phpUser && phpUser.id) localStorage.setItem('current_session_user', JSON.stringify(phpUser));
        } catch(e) {}
    })();
</script>