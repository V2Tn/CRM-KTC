<div id="ranking-view-container" class="max-w-[1000px] mx-auto pb-20 px-4 md:px-6 font-['Lexend'] animate-in fade-in slide-in-from-bottom-4 duration-500">
    
   <div class="flex flex-col md:flex-row md:items-start justify-between mb-12 gap-6 relative">
        <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
                <div class="h-8 w-1.5 bg-amber-400 rounded-full"></div>
                <h2 class="text-3xl font-[900] text-slate-800 uppercase tracking-tight">Bảng Vàng Vinh Danh</h2>
            </div>
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest pl-5 mb-3">Xếp hạng năng suất & đánh giá nhân sự</p>
            
            <details class="group pl-5 relative z-[60]">
                <summary class="inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-500 uppercase tracking-widest cursor-pointer list-none select-none bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm border border-indigo-100/50">
                    <i data-lucide="help-circle" width="14"></i> Quy tắc tính điểm
                </summary>
                
                <div class="absolute top-full left-5 mt-2 w-[300px] md:w-[360px] p-5 bg-white border border-slate-100 shadow-2xl shadow-indigo-100/50 rounded-2xl text-slate-600 animate-in fade-in slide-in-from-top-2">
                    <h4 class="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3 border-b border-slate-50 pb-2">Hệ số điểm KPI Hệ thống</h4>
                    
                    <div class="space-y-2.5 text-[11px] font-bold">
                        <div class="flex justify-between items-center">
                            <span class="flex items-center gap-2"><i data-lucide="check-circle" width="14" class="text-emerald-500"></i> Xong đúng/trước hạn</span> 
                            <span class="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md shadow-sm">+10 điểm</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="flex items-center gap-2"><i data-lucide="clock" width="14" class="text-amber-500"></i> Xong nhưng trễ hạn</span> 
                            <span class="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md shadow-sm">+5 điểm</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="flex items-center gap-2"><i data-lucide="alert-circle" width="14" class="text-rose-500"></i> Đang trễ hạn (Chưa xong)</span> 
                            <span class="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md shadow-sm">-5 điểm</span>
                        </div>
                        
                        <div class="h-px bg-slate-100 my-2"></div>
                        
                        <div class="flex justify-between items-center">
                            <span class="flex items-center gap-2"><i data-lucide="star" width="14" class="text-yellow-500"></i> Quản lý đánh giá: Xuất sắc</span> 
                            <span class="text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-md shadow-sm">+50 điểm</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="flex items-center gap-2"><i data-lucide="thumbs-up" width="14" class="text-blue-500"></i> Quản lý đánh giá: Tốt</span> 
                            <span class="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md shadow-sm">+20 điểm</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="flex items-center gap-2"><i data-lucide="thumbs-down" width="14" class="text-rose-500"></i> Quản lý đánh giá: Kém</span> 
                            <span class="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md shadow-sm">-30 điểm</span>
                        </div>
                    </div>
                </div>
            </details>
        </div>
        
        <div class="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl shrink-0 mt-4 md:mt-0">
            <button onclick="RankingController.loadData('week')" class="ranking-period-btn px-6 py-2.5 text-xs font-black rounded-xl transition-all">Tuần này</button>
            <button onclick="RankingController.loadData('month')" class="ranking-period-btn px-6 py-2.5 text-xs font-black rounded-xl transition-all">Tháng này</button>
            <button onclick="RankingController.loadData('all')" class="ranking-period-btn px-6 py-2.5 text-xs font-black rounded-xl transition-all">Tất cả</button>
        </div>
    </div>

    <div class="bg-white rounded-[40px] p-8 md:p-12 shadow-2xl shadow-indigo-100/50 border border-slate-50 mb-10 overflow-hidden relative">
        <div class="absolute -top-20 -left-20 w-64 h-64 bg-amber-100/50 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl"></div>
        
        <div class="text-center mb-16 relative z-10">
            <h3 class="text-xl font-black text-indigo-900 uppercase tracking-widest">🏆 TOP 3 XUẤT SẮC NHẤT</h3>
        </div>

        <div id="podium-container" class="flex items-end justify-center gap-2 md:gap-6 max-w-[600px] mx-auto h-[320px] relative z-10">
            <div class="w-full text-center animate-pulse text-indigo-300 font-bold text-xs uppercase tracking-widest">Đang tải dữ liệu xếp hạng...</div>
        </div>
    </div>

    <div>
        <h3 class="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 ml-4">Bảng xếp hạng tổng</h3>
        <div id="ranking-list-container" class="flex flex-col gap-3">
            </div>
    </div>

</div>
<div id="ranking-detail-modal" class="fixed inset-0 z-[9999] hidden flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onclick="RankingController.closeModal()"></div>
        
        <div class="relative bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div class="bg-indigo-600 p-6 text-center relative">
                <button onclick="RankingController.closeModal()" class="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors">
                    <i data-lucide="x" width="16"></i>
                </button>
                <img id="ranking-detail-avatar" src="" class="w-20 h-20 rounded-full border-4 border-white/20 mx-auto object-cover mb-3 shadow-lg">
                <h3 id="ranking-detail-name" class="text-xl font-black text-white uppercase tracking-tight">Tên Nhân Viên</h3>
                <p class="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mt-1">Hồ sơ năng suất chi tiết</p>
            </div>
            
            <div id="ranking-detail-content" class="p-6 bg-slate-50/50">
                </div>
        </div>
    </div>