<div id="dept-form-modal" class="fixed inset-0 z-[1000] flex items-center justify-center p-4 hidden">
    <div class="absolute inset-0 bg-[#1e1b4b]/80 backdrop-blur-sm transition-opacity" onclick="DepartmentController.closeDeptModal()"></div>
    
    <div class="relative w-full max-w-[900px] bg-[#f8fafc] rounded-[24px] shadow-2xl animate-in zoom-in duration-300 flex overflow-hidden h-[550px]">
        
        <button onclick="DepartmentController.closeDeptModal()" class="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-rose-500 hover:text-white text-slate-500 transition-all">
            <i data-lucide="x" width="18"></i>
        </button>

        <div class="w-1/2 bg-white p-6 flex flex-col border-r border-slate-100 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            
            <div class="mb-5 flex items-center gap-4">
                <div class="w-14 h-14 bg-white rounded-[18px] border-2 border-indigo-100 flex items-center justify-center shadow-lg shadow-indigo-50 shrink-0">
                    <i data-lucide="briefcase" width="24" class="text-indigo-600"></i>
                </div>
                <h2 id="dept-modal-title" class="text-xl font-[900] text-slate-800 uppercase tracking-tight">Thêm phòng ban</h2>
            </div>

            <form id="dept-form" onsubmit="DepartmentController.saveDept(event)" class="space-y-4 flex-1 flex flex-col">
                <input type="hidden" name="id" id="dept-id">
                
                <div class="space-y-1.5">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên bộ phận</label>
                    <input type="text" name="name" required class="w-full bg-slate-50 border-none rounded-xl px-4 py-2.5 font-bold text-slate-700 text-sm focus:ring-2 focus:ring-indigo-100 transition-all placeholder:font-normal" placeholder="VD: Kinh doanh">
                </div>

                <div class="space-y-1.5 relative">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quản lý trực tiếp</label>
    
                    <p id="manager-warning" class="hidden text-[10px] font-bold text-rose-500 italic ml-1 mb-1">
                        <i data-lucide="alert-circle" width="10" class="inline"></i> 
                        <span id="manager-warning-text"></span>
                    </p>

                    <div class="relative group" id="custom-manager-group">
                        <button type="button" id="btn-manager-select" onclick="DepartmentController.toggleDropdown('manager-dropdown')" 
                            class="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border-2 border-transparent rounded-xl font-bold text-slate-700 text-sm hover:bg-white hover:border-indigo-100 transition-all outline-none focus:bg-white focus:border-indigo-100 shadow-sm">
                            <span id="label-manager-selected" class="truncate">-- Chọn quản lý --</span>
                            <i data-lucide="chevron-down" class="text-slate-400 transition-transform duration-300" width="16"></i>
                        </button>
                        
                        <div id="manager-dropdown" class="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-50 p-2 z-[100] hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div class="max-h-[200px] overflow-y-auto scrollbar-hide space-y-1" id="list-manager-options">
                                </div>
                        </div>
                    </div>
                    <input type="hidden" name="manager_id" id="dept-manager-hidden-val">
                </div>

                <div class="space-y-1.5 flex-1 flex flex-col">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả chức năng</label>
                    <textarea name="description" class="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-700 text-sm focus:ring-2 focus:ring-indigo-100 resize-none flex-1" placeholder="Mô tả nhiệm vụ..."></textarea>
                </div>

                <div class="pt-2">
                    <button type="submit" id="btn-save-dept" class="w-full bg-[#5b61f1] hover:bg-[#4f46e5] text-white py-3.5 rounded-xl font-[900] uppercase tracking-widest text-xs shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]">
                        <i data-lucide="save" width="16" class="inline-block mr-1 -mt-0.5"></i> Lưu thay đổi
                    </button>
                </div>
            </form>
        </div>

        <div class="w-1/2 bg-[#f8fafc] p-6 flex flex-col relative">
            
            <div class="flex justify-between items-center mb-4 pr-10">
                <div>
                    <label class="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                        <i data-lucide="users" width="14"></i> Thành viên (<span id="member-count">0</span>)
                    </label>
                </div>
                <button onclick="DepartmentController.toggleAddMemberView(true)" class="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap">
                    + Thêm nhân sự
                </button>
            </div>

            <div id="current-members-list" class="flex-1 overflow-y-auto space-y-2 pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                </div>

            <div id="add-member-overlay" class="absolute inset-0 bg-white z-30 p-6 flex flex-col transition-all duration-300 translate-x-full border-l border-slate-100 shadow-xl">
                
                <div class="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
                    <h4 class="font-black text-slate-700 uppercase text-xs tracking-widest flex items-center gap-2">
                        <span class="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                        Chọn nhân sự
                    </h4>
                    
                    <button onclick="Utils.toggleAddMemberView(false)" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-all text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                        <span>Đóng</span>
                        <i data-lucide="x" width="14"></i>
                    </button>
                </div>
                
                <div class="mb-4 relative">
                    <input type="text" id="search-member-input" onkeyup="DepartmentController.filterAvailableMembers()" class="w-full bg-slate-50 rounded-xl pl-10 pr-4 py-3 text-xs font-bold border-none outline-none focus:ring-2 focus:ring-indigo-100 text-slate-600 placeholder:font-normal placeholder:text-slate-400 transition-all" placeholder="Tìm theo tên nhân viên...">
                    <i data-lucide="search" width="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                </div>

                <div id="available-members-list" class="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    </div>
            </div>

        </div>
    </div>
</div>