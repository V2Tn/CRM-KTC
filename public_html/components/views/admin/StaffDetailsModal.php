<div id="staff-form-modal" class="fixed inset-0 z-[1000] flex items-center justify-center p-4 hidden">
    <div class="absolute inset-0 bg-[#1e1b4b]/60 backdrop-blur-sm transition-opacity" onclick="StaffController.closeModal()"></div>
    
    <div class="relative w-full max-w-[800px] bg-white rounded-[32px] shadow-2xl animate-in zoom-in duration-300 transform scale-100">
        
        <div class="absolute -top-10 left-1/2 -translate-x-1/2">
            <div class="w-24 h-24 bg-white rounded-[30px] p-2 shadow-xl shadow-indigo-900/10">
                <img id="staff-modal-avatar-preview" src="https://via.placeholder.com/128?text=USER" class="w-full h-full bg-slate-50 rounded-[22px] object-cover border border-slate-100">
            </div>
        </div>

        <button onclick="StaffController.closeModal()" class="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-rose-500 transition-all">
            <i data-lucide="x" width="20"></i>
        </button>

        <form id="staff-form" onsubmit="StaffController.saveStaff(event)" class="pt-20 px-10 pb-10 font-['Lexend']">
            
            <input type="hidden" name="id" id="staff-id">
            
            <h3 id="modal-title" class="text-center text-xl font-[900] text-slate-800 uppercase tracking-tight mb-10">
                Thêm nhân sự mới
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                
                <div class="space-y-5">
                    <div class="space-y-2">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Họ tên nhân viên</label>
                        <input type="text" name="fullName" required 
                            class="w-full px-5 py-3.5 bg-[#f8fafc] border-2 border-transparent focus:border-indigo-200 focus:bg-white rounded-2xl font-bold text-slate-700 text-sm outline-none transition-all placeholder-slate-300" 
                            placeholder="Nhập họ và tên...">
                    </div>

                    <div class="space-y-2">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Tài khoản</label>
                        <input type="text" name="username" required 
                            class="w-full px-5 py-3.5 bg-[#f8fafc] border-2 border-transparent focus:border-indigo-200 focus:bg-white rounded-2xl font-bold text-slate-700 text-sm outline-none transition-all placeholder-slate-300" 
                            placeholder="username">
                    </div>

                    <div class="space-y-2">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Email liên hệ</label>
                        <input type="email" name="email" 
                            class="w-full px-5 py-3.5 bg-[#f8fafc] border-2 border-transparent focus:border-indigo-200 focus:bg-white rounded-2xl font-bold text-slate-700 text-sm outline-none transition-all placeholder-slate-300" 
                            placeholder="email@company.com">
                    </div>

                    <div class="space-y-2">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Số điện thoại</label>
                        <input type="tel" name="phone" 
                            class="w-full px-5 py-3.5 bg-[#f8fafc] border-2 border-transparent focus:border-indigo-200 focus:bg-white rounded-2xl font-bold text-slate-700 text-sm outline-none transition-all placeholder-slate-300" 
                            placeholder="09xx.xxx.xxx">
                    </div>
                </div>

                <div class="space-y-5">
                    <div class="space-y-2">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Mật khẩu</label>
                        <div class="relative">
                            <input type="text" name="password" 
                                class="w-full px-5 py-3.5 bg-[#f8fafc] border-2 border-transparent focus:border-indigo-200 focus:bg-white rounded-2xl font-bold text-slate-700 text-sm outline-none transition-all placeholder-slate-300" 
                                placeholder="••••••">
                            <div class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                                <i data-lucide="eye" width="18"></i>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-2 relative">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Phòng ban</label>
                        <div class="relative group" id="custom-dept-group">
                            <button type="button" onclick="Utils.toggleDropdown('dept-dropdown')" 
                                class="w-full flex items-center justify-between px-5 py-3.5 bg-[#f8fafc] border-2 border-transparent rounded-2xl font-bold text-slate-700 text-sm hover:bg-white hover:border-indigo-500 transition-all outline-none shadow-sm">
                                <span id="label-dept-selected">-- Chọn phòng ban --</span>
                                <i data-lucide="chevron-down" class="text-slate-400 transition-transform duration-300" width="16"></i>
                            </button>
                            
                            <div id="dept-dropdown" class="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-50 p-2 z-[100] hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div class="max-h-[200px] overflow-y-auto scrollbar-hide space-y-1" id="list-dept-options">
                                    </div>
                            </div>
                        </div>
                        <input type="hidden" name="department" id="staff-dept-hidden-val">
                    </div>

                    <div class="space-y-2 relative">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Phân quyền</label>
                        <div class="relative group" id="custom-role-group">
                            <button type="button" onclick="Utils.toggleDropdown('role-dropdown')" 
                                class="w-full flex items-center justify-between px-5 py-3.5 bg-[#f8fafc] border-2 border-transparent rounded-2xl font-bold text-slate-700 text-sm hover:bg-white hover:border-indigo-500 transition-all outline-none shadow-sm">
                                <span id="label-role-selected">-- Chọn quyền hạn --</span>
                                <i data-lucide="chevron-down" class="text-slate-400 transition-transform duration-300" width="16"></i>
                            </button>
                            
                            <div id="role-dropdown" class="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-50 p-2 z-[100] hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div class="max-h-[200px] overflow-y-auto scrollbar-hide space-y-1" id="list-role-options">
                                    </div>
                            </div>
                        </div>
                        <input type="hidden" name="role" id="staff-role-hidden-val">
                    </div>

                    <div class="pt-4">
                        <div class="flex items-center justify-between p-4 bg-[#f8fafc] rounded-2xl border border-slate-50">
                            <div class="flex items-center gap-2">
                                <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span class="text-[11px] font-black text-slate-600 uppercase tracking-wider">Trạng thái hoạt động</span>
                            </div>
                            
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" name="active" class="sr-only peer" checked>
                                <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-10">
                <button type="submit" id="btn-save-staff" class="w-full bg-[#5b61f1] hover:bg-[#4f46e5] text-white font-[900] py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] uppercase tracking-widest text-xs">
                    LƯU THÔNG TIN NHÂN SỰ
                </button>
            </div>

        </form>
    </div>
</div>