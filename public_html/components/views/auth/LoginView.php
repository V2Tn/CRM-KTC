<div class="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 font-['Lexend'] relative overflow-hidden">
    
    <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] -z-10"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] -z-10"></div>

    <div class="w-full max-w-[420px] flex flex-col items-center relative z-10">
        <div class="flex flex-col items-center mb-10">
            <div class="w-16 h-16 bg-white rounded-[24px] shadow-xl flex items-center justify-center mb-4 border border-slate-50">
                <img src="uploads/logo.png" alt="Logo Kim Tâm Cát" class="w-10 h-10 object-contain">
            </div>
            <h1 class="text-3xl font-[900] text-[#0f172a] uppercase tracking-tighter">Kim Tâm Cát</h1>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Hệ thống quản trị nội bộ</p>
        </div>

        <div class="w-full bg-white rounded-[44px] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-50">
            <form onsubmit="AuthController.login(event)" class="space-y-6">
                
                <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tài khoản nhân viên</label>
                    <div class="relative">
                        <span class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                            <i data-lucide="user" width="18"></i>
                        </span>
                        <input type="text" name="username" required 
                            class="w-full pl-12 pr-5 py-4 bg-slate-50 border-transparent rounded-2xl font-bold text-slate-800 focus:bg-white focus:border-indigo-500 border-2 outline-none transition-all placeholder:text-slate-300" 
                            placeholder="USERNAME" />
                    </div>
                </div>

                <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Mật khẩu bảo mật</label>
                    <div class="relative">
                        <span class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                            <i data-lucide="lock" width="18"></i>
                        </span>
                        <input type="password" name="password" required 
                            class="w-full pl-12 pr-5 py-4 bg-slate-50 border-transparent rounded-2xl font-bold text-slate-800 focus:bg-white focus:border-indigo-500 border-2 outline-none transition-all placeholder:text-slate-300" 
                            placeholder="••••••••" />
                    </div>
                </div>

                <button type="submit" id="btn-submit" 
                    class="w-full bg-[#5b61f1] hover:bg-[#4a4ec4] text-white font-[900] py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 mt-4 flex items-center justify-center gap-3">
                    ĐĂNG NHẬP NGAY
                </button>
            </form>
        </div>
        
        <p class="mt-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">© 2026 KIM GROUP</p>
    </div>

    <div id="login-loading" class="fixed inset-0 z-[10000] hidden flex items-center justify-center bg-slate-900/40 backdrop-blur-md transition-all duration-500 opacity-0 pointer-events-none">
        <div id="loading-box" class="bg-white p-12 rounded-[48px] shadow-2xl flex flex-col items-center text-center max-w-[320px] transform scale-95 transition-all duration-500">
            <div class="relative w-24 h-24 mb-8 flex items-center justify-center">
                <div class="absolute inset-0 rounded-full border-[6px] border-slate-100"></div>
                <div class="absolute inset-0 rounded-full border-[6px] border-indigo-600 border-t-transparent animate-spin"></div>
                <img src="uploads/logo.png" class="w-12 h-12 object-contain relative z-10" onerror="this.src='https://via.placeholder.com/150?text=LOGO'">
            </div>
            <h3 id="loading-title" class="text-xl font-[1000] text-slate-800 uppercase tracking-tight mb-2">Đang xác thực</h3>
            <p id="loading-desc" class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kiểm tra thông tin bảo mật...</p>
        </div>
    </div>

    <div id="login-error-modal" class="fixed inset-0 z-[9999] hidden flex items-center justify-center font-['Lexend'] p-4">
    <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onclick="document.getElementById('login-error-modal').classList.add('hidden')"></div>
    <div class="relative bg-white rounded-[24px] w-full max-w-sm p-6 shadow-2xl text-center animate-in zoom-in-95 duration-200">
        <div class="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-inner">
            <i data-lucide="alert-triangle" width="32"></i>
        </div>
        <h3 class="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">Đăng nhập thất bại</h3>
        <p id="login-error-message" class="text-sm font-medium text-slate-600 mb-6 leading-relaxed">Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.</p>
        <button onclick="document.getElementById('login-error-modal').classList.add('hidden')" class="w-full py-3 bg-slate-100 text-slate-600 font-[900] text-xs uppercase rounded-xl hover:bg-slate-200 transition-all">Đã hiểu</button>
    </div>
</div>
</div>