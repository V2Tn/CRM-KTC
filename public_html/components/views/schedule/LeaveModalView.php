<div id="leave-form-modal" class="fixed inset-0 z-[10000] flex items-center justify-center hidden font-['Lexend'] p-4">
    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onclick="LeaveService.closeForm()"></div>
    
    <div class="relative bg-white rounded-[24px] w-full max-w-[640px] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 overflow-visible">
        
        <h3 class="text-xl font-[900] text-slate-800 uppercase flex items-center gap-3 mb-6">
            <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shadow-sm">
                <i data-lucide="coffee" width="22"></i>
            </div>
            Đơn Xin Nghỉ Phép
        </h3>

        <form onsubmit="LeaveService.submitForm(event)" class="space-y-5">
            
            <div class="grid grid-cols-2 gap-5">
                <div class="relative group custom-dropdown-container">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">Loại phép</label>
                    <button type="button" onclick="toggleCustomDropdown('leave-type-dropdown')" 
                        class="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl font-bold text-slate-700 text-sm hover:bg-white hover:border-indigo-100 transition-all outline-none focus:bg-white focus:border-indigo-100 shadow-sm">
                        <span id="leave-type-label" class="truncate">Phép năm</span>
                        <i data-lucide="chevron-down" class="text-slate-400 transition-transform duration-300" width="16"></i>
                    </button>
                    <div id="leave-type-dropdown" class="custom-dropdown-menu absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-50 p-2 z-[100] hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div class="max-h-[200px] overflow-y-auto scrollbar-hide space-y-1">
                            <div onclick="selectCustomDropdown('leave-type', 'PHÉP NĂM', 'Phép năm')" class="p-3 rounded-xl text-xs font-[800] text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-all">Phép năm</div>
                            <div onclick="selectCustomDropdown('leave-type', 'ỐM ĐAU', 'Ốm đau')" class="p-3 rounded-xl text-xs font-[800] text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-all">Ốm đau</div>
                            <div onclick="selectCustomDropdown('leave-type', 'VIỆC RIÊNG', 'Việc riêng')" class="p-3 rounded-xl text-xs font-[800] text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-all">Việc riêng</div>
                            <div onclick="selectCustomDropdown('leave-type', 'KHÁC', 'Lý do khác')" class="p-3 rounded-xl text-xs font-[800] text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-all">Lý do khác</div>
                        </div>
                    </div>
                    <input type="hidden" id="leave-type-hidden" value="PHÉP NĂM">
                </div>

                <div class="relative group custom-dropdown-container">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">Người duyệt (Sếp)</label>
                    <button type="button" onclick="toggleCustomDropdown('leave-manager-dropdown')" 
                        class="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl font-bold text-slate-700 text-sm hover:bg-white hover:border-indigo-100 transition-all outline-none focus:bg-white focus:border-indigo-100 shadow-sm">
                        <span id="leave-manager-label" class="truncate text-indigo-700">Đang tải...</span>
                        <i data-lucide="chevron-down" class="text-slate-400 transition-transform duration-300" width="16"></i>
                    </button>
                    <div id="leave-manager-dropdown" class="custom-dropdown-menu absolute top-full left-0 w-[120%] mt-2 bg-white rounded-xl shadow-xl border border-slate-50 p-2 z-[100] hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div class="max-h-[220px] overflow-y-auto custom-scrollbar space-y-1 pr-1" id="list-manager-options"></div>
                    </div>
                    <input type="hidden" id="leave-manager-hidden" value="">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-5">
                <div><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Từ ngày</label><input type="date" id="leave-start" required class="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-inner"></div>
                <div><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Đến ngày</label><input type="date" id="leave-end" required class="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-inner"></div>
            </div>

            <div><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Lý do cụ thể</label><textarea id="leave-reason" required rows="2" class="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none shadow-inner" placeholder="Trình bày lý do xin nghỉ..."></textarea></div>

            <div class="pt-1">
                <div class="flex justify-between items-center mb-2 ml-1">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Người theo dõi (CC)</label>
                    <button type="button" onclick="LeaveService.toggleFollowerList()" class="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors"><i data-lucide="plus" width="12"></i> Thêm CC</button>
                </div>
                
                <div id="leave-selected-followers-tags" class="flex flex-wrap gap-2 mb-2 empty:hidden"></div>

                <div id="leave-follower-select-box" class="hidden bg-white p-3 rounded-2xl border border-slate-100 shadow-sm mt-3 transition-all duration-300">
                    <div class="relative mb-3">
                        <input type="text" id="search-follower-input" onkeyup="LeaveService.searchFollowers()" placeholder="Tìm tên nhân viên..." class="w-full bg-slate-50 rounded-xl pl-10 pr-3 py-2.5 text-xs font-bold border-none outline-none focus:ring-2 focus:ring-indigo-100 text-slate-600 transition-all">
                        <i data-lucide="search" width="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    </div>
                    <div id="leave-followers-list" class="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        <div class="text-xs text-center text-slate-400 py-2">Đang tải...</div>
                    </div>
                </div>
            </div>

            <div class="flex justify-end gap-3 mt-8 pt-5 border-t border-slate-100">
                <button type="button" onclick="LeaveService.closeForm()" class="px-6 py-3 bg-slate-100 text-slate-600 font-[900] text-xs uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-all">Hủy</button>
                <button type="submit" class="px-8 py-3 bg-rose-500 text-white font-[900] text-xs uppercase tracking-wider rounded-xl hover:bg-rose-600 shadow-lg shadow-rose-200 active:scale-95 transition-all">Gửi Đơn</button>
            </div>
        </form>
    </div>
</div>