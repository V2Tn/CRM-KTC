<div id="event-form-modal" class="fixed inset-0 z-[10000] flex items-center justify-center hidden font-['Lexend'] p-4">
    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onclick="EventService.closeForm()"></div>
    
    <div class="relative bg-white rounded-[24px] w-full max-w-[640px] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 overflow-visible">
        
        <h3 class="text-xl font-[900] text-slate-800 uppercase flex items-center gap-3 mb-6">
            <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                <i data-lucide="megaphone" width="22"></i>
            </div>
            Tạo Sự Kiện / Thông Báo
        </h3>
        
        <form onsubmit="EventService.submitForm(event)" class="space-y-5">
            <div>
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">Tên sự kiện <span class="text-rose-500">*</span></label>
                <input type="text" id="event-title" required class="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 shadow-inner" placeholder="VD: Liên hoan cuối tháng, Họp giao ban...">
            </div>

            <div class="grid grid-cols-2 gap-5">
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">Bắt đầu <span class="text-rose-500">*</span></label>
                    <div class="flex gap-2">
                        <input type="date" id="event-start-date" required class="w-3/5 bg-slate-50 border-none rounded-xl px-3 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 shadow-inner">
                        <input type="time" id="event-start-time" required class="w-2/5 bg-slate-50 border-none rounded-xl px-2 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 shadow-inner">
                    </div>
                </div>
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">Kết thúc</label>
                    <div class="flex gap-2">
                        <input type="date" id="event-end-date" class="w-3/5 bg-slate-50 border-none rounded-xl px-3 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 shadow-inner">
                        <input type="time" id="event-end-time" class="w-2/5 bg-slate-50 border-none rounded-xl px-2 py-3 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 shadow-inner">
                    </div>
                </div>
            </div>

            <div class="custom-dropdown-container relative">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">Thông báo tới <span class="text-rose-500">*</span></label>
                <button type="button" onclick="toggleCustomDropdown('event-notify-dropdown')" class="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 border-2 border-transparent rounded-xl font-bold text-indigo-700 text-sm hover:bg-white hover:border-indigo-200 transition-all outline-none shadow-sm">
                    <span id="event-notify-label" class="truncate">Toàn công ty</span>
                    <i data-lucide="chevron-down" class="text-indigo-400 transition-transform duration-300" width="16"></i>
                </button>
                
                <div id="event-notify-dropdown" class="custom-dropdown-menu absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-[100] hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div class="space-y-1">
                        <div onclick="selectCustomDropdown('event-notify', 'ALL', 'Toàn công ty', 'EventService.toggleUserSelect()')" class="p-3 rounded-xl text-sm font-[800] text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-all flex items-center gap-3"><i data-lucide="globe" width="16"></i> Toàn công ty</div>
                        <div onclick="selectCustomDropdown('event-notify', 'SPECIFIC', 'Người liên quan cụ thể', 'EventService.toggleUserSelect()')" class="p-3 rounded-xl text-sm font-[800] text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-all flex items-center gap-3"><i data-lucide="users" width="16"></i> Người liên quan cụ thể</div>
                    </div>
                </div>
                <input type="hidden" id="event-notify-hidden" value="ALL">
            </div>

            <div id="event-user-select-container" class="hidden pt-1 border-t border-slate-100 mt-4">
                <div class="flex justify-between items-center mb-2 ml-1">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh sách người nhận</label>
                    <button type="button" onclick="EventService.toggleUserList()" class="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors"><i data-lucide="plus" width="12"></i> Thêm người</button>
                </div>
                
                <div id="event-selected-users-tags" class="flex flex-wrap gap-2 mb-2 empty:hidden"></div>

                <div id="event-user-list-box" class="hidden bg-white p-3 rounded-2xl border border-slate-100 shadow-sm mt-3 transition-all duration-300">
                    <div class="relative mb-3">
                        <input type="text" id="search-event-user-input" onkeyup="EventService.searchUsers()" placeholder="Tìm tên nhân viên..." class="w-full bg-slate-50 rounded-xl pl-10 pr-3 py-2.5 text-xs font-bold border-none outline-none focus:ring-2 focus:ring-indigo-100 text-slate-600 transition-all">
                        <i data-lucide="search" width="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    </div>
                    <div id="event-user-list" class="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        <div class="text-xs text-center text-slate-400 py-2">Đang tải...</div>
                    </div>
                </div>
            </div>

            <div>
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">Nội dung / Ghi chú</label>
                <textarea id="event-content" rows="2" class="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 resize-none shadow-inner" placeholder="Nhập mô tả chi tiết, địa điểm..."></textarea>
            </div>

            <div class="flex justify-end gap-3 mt-8 pt-5 border-t border-slate-100">
                <button type="button" onclick="EventService.closeForm()" class="px-6 py-3 bg-slate-100 text-slate-600 font-[900] text-xs uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-all">Hủy</button>
                <button type="submit" class="px-8 py-3 bg-indigo-600 text-white font-[900] text-xs uppercase tracking-wider rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95 transition-all">Phát Thông Báo</button>
            </div>
        </form>
    </div>
</div>