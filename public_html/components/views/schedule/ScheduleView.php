<div class="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 font-['Lexend']" id="schedule-view-container">
    
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
        <div>
            <div class="flex items-center gap-3 mb-1">
                <div class="h-8 w-1.5 bg-indigo-500 rounded-full"></div>
                <h2 class="text-3xl font-[900] text-slate-800 uppercase tracking-tight">Hành Chính & Nội Bộ</h2>
            </div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest pl-5">Lịch trình công ty & Quản lý nghỉ phép</p>
        </div>
        
        <div class="flex items-center gap-3">
            <button onclick="ScheduleController.openActionModal(null, 'LEAVE')" class="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm">
                <i data-lucide="coffee" width="16"></i> Xin nghỉ phép
            </button>

            <button id="btn-quick-event" onclick="ScheduleController.proceedToForm('EVENT')" class="hidden flex items-center gap-2 px-5 py-2.5 bg-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200">
                <i data-lucide="megaphone" width="16"></i> Tạo sự kiện
            </button>
        </div>
    </div>

   <div class="bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-sm">
        <div class="flex items-center justify-start mb-6 relative w-max"> 
            <div>
                <button onclick="ScheduleController.toggleMonthPicker(event)" class="flex items-center gap-2 hover:bg-slate-50 px-4 py-2 rounded-xl transition-colors cursor-pointer outline-none border border-transparent hover:border-slate-200">
                    <h3 id="calendar-month-year" class="text-xl font-black text-slate-800 uppercase tracking-tight">Tháng -- / ----</h3>
                    <i data-lucide="chevron-down" class="text-slate-400"></i>
                </button>
                
                <div id="month-picker-popup" class="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 hidden w-72 cursor-default" onclick="event.stopPropagation()">
                    <div class="flex justify-between items-center mb-4">
                        <button onclick="ScheduleController.changePickerYear(-1)" class="p-1 hover:bg-slate-100 rounded text-slate-500"><i data-lucide="chevron-left" width="16"></i></button>
                        <span id="picker-year-display" class="font-black text-slate-700">2026</span>
                        <button onclick="ScheduleController.changePickerYear(1)" class="p-1 hover:bg-slate-100 rounded text-slate-500"><i data-lucide="chevron-right" width="16"></i></button>
                    </div>
                    <div class="grid grid-cols-4 gap-2 text-center" id="picker-months-grid">
                        </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-7 gap-4 text-center mb-4">
            <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">T2</div>
            <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">T3</div>
            <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">T4</div>
            <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">T5</div>
            <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">T6</div>
            <div class="text-[10px] font-black text-indigo-400 uppercase tracking-widest">T7</div>
            <div class="text-[10px] font-black text-rose-400 uppercase tracking-widest">CN</div>
        </div>

        <div id="calendar-grid" class="grid grid-cols-7 gap-3 md:gap-5 mt-2">
            </div>
    </div>
</div>

<div id="schedule-action-modal" class="fixed inset-0 z-[9999] flex items-center justify-center hidden font-['Lexend'] p-4">
    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onclick="ScheduleController.closeActionModal()"></div>
    
    <div class="relative bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <button onclick="ScheduleController.closeActionModal()" class="absolute top-6 right-6 text-slate-300 hover:text-rose-500 transition-colors">
            <i data-lucide="x" width="24"></i>
        </button>

        <div class="text-center mb-8 mt-2">
            <div class="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-inner">
                <i data-lucide="calendar-plus" width="32"></i>
            </div>
            <h3 class="text-lg font-black text-slate-800 uppercase tracking-tight">Tạo sự kiện mới</h3>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Ngày chọn: <span id="modal-selected-date" class="text-indigo-600">--/--/----</span></p>
        </div>

        <div class="flex flex-col gap-4">
            <button onclick="ScheduleController.proceedToForm('LEAVE')" class="w-full text-left bg-white border-2 border-slate-100 p-4 rounded-2xl hover:border-rose-200 hover:bg-rose-50 transition-all group flex items-center gap-5">
                <div class="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-rose-100 group-hover:text-rose-500 transition-colors shrink-0">
                    <i data-lucide="coffee" width="24"></i>
                </div>
                <div>
                    <h4 class="font-black text-slate-800 text-sm uppercase group-hover:text-rose-600 transition-colors">Đơn xin nghỉ phép</h4>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gửi yêu cầu nghỉ vắng mặt</p>
                </div>
            </button>

            <button id="modal-btn-event" onclick="ScheduleController.proceedToForm('EVENT')" class="w-full text-left bg-white border-2 border-slate-100 p-4 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50 transition-all group flex items-center gap-5">
                <div class="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-500 transition-colors shrink-0">
                    <i data-lucide="megaphone" width="24"></i>
                </div>
                <div>
                    <h4 class="font-black text-slate-800 text-sm uppercase group-hover:text-indigo-600 transition-colors">Sự kiện công ty</h4>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Họp hành, liên hoan, thông báo chung</p>
                </div>
            </button>
        </div>
    </div>
</div>

<div id="more-events-modal" class="fixed inset-0 z-[10005] flex items-center justify-center hidden font-['Lexend'] p-4">
    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onclick="ScheduleController.closeMoreEventsModal()"></div>
    <div class="relative bg-white rounded-[24px] w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        
        <div class="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
            <div>
                <h3 class="text-lg font-black text-slate-800 uppercase tracking-tight">Danh sách sự kiện</h3>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Ngày <span id="more-events-date" class="text-indigo-600">--/--/----</span></p>
            </div>
            <button onclick="ScheduleController.closeMoreEventsModal()" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                <i data-lucide="x" width="16"></i>
            </button>
        </div>
        
        <div id="more-events-list" class="flex flex-col gap-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
            </div>

    </div>
</div>

<?php 
    include 'LeaveModalView.php'; 
    include 'EventModalView.php'; 
    include 'DetailModalView.php';
?>

<script src="/js/service/schedule/leave.service.js"></script>
<script src="/js/service/schedule/event.service.js"></script>
<script src="/js/service/schedule/detail.service.js"></script>
<script>
    // Hàm mở/đóng dropdown
    window.toggleCustomDropdown = function(id) {
        const el = document.getElementById(id);
        // Đóng các dropdown khác đang mở
        document.querySelectorAll('.custom-dropdown-menu').forEach(d => {
            if (d.id !== id) d.classList.add('hidden');
        });

        if (el) {
            el.classList.toggle('hidden');
            const icon = el.previousElementSibling.querySelector('[data-lucide="chevron-down"]');
            if (icon) icon.style.transform = el.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    };

    // Hàm khi chọn 1 option
    window.selectCustomDropdown = function(prefix, value, label, callbackStr = null) {
        const labelEl = document.getElementById(`${prefix}-label`);
        const inputEl = document.getElementById(`${prefix}-hidden`);
        const dropdown = document.getElementById(`${prefix}-dropdown`);

        if (labelEl) labelEl.innerText = label;
        if (inputEl) inputEl.value = value;
        
        if (dropdown) {
            dropdown.classList.add('hidden');
            const icon = dropdown.previousElementSibling.querySelector('[data-lucide="chevron-down"]');
            if (icon) icon.style.transform = 'rotate(0deg)';
        }

        // Chạy hàm callback nếu có (Dùng cho form Sự kiện)
        if (callbackStr) eval(callbackStr);
    };

    // Click ra ngoài thì tự đóng Dropdown
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown-container')) {
            document.querySelectorAll('.custom-dropdown-menu').forEach(d => {
                d.classList.add('hidden');
                const icon = d.previousElementSibling?.querySelector('[data-lucide="chevron-down"]');
                if (icon) icon.style.transform = 'rotate(0deg)';
            });
        }
    });
</script>