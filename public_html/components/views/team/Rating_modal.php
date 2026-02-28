<div id="rating-modal" class="fixed inset-0 z-[9999] hidden flex items-center justify-center transition-all duration-200">
    <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onclick="TeamController.closeRatingModal()"></div>
    
    <div class="bg-white rounded-[32px] p-8 w-[90%] max-w-md shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
        <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-[900] text-slate-800 uppercase tracking-tight">Đánh giá tháng</h3>
            <button onclick="TeamController.closeRatingModal()" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-500 transition-colors">
                <i data-lucide="x" width="16"></i>
            </button>
        </div>

        <div class="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div class="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 font-black flex items-center justify-center text-lg shadow-inner" id="rating-avatar-preview">U</div>
            <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nhân sự</p>
                <h4 class="text-sm font-black text-slate-800 uppercase" id="rating-staff-name">Tên nhân viên</h4>
            </div>
        </div>

        <form onsubmit="TeamController.submitRating(event)">
            <input type="hidden" id="rating-staff-id" value="">
            
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Chọn mức đánh giá</p>
            
            <div class="grid grid-cols-3 gap-3 mb-6">
                <label class="cursor-pointer group relative">
                    <input type="radio" name="rating_type" value="STAR" class="peer sr-only">
                    <div class="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-slate-100 bg-slate-50 peer-checked:border-yellow-400 peer-checked:bg-yellow-50 transition-all group-hover:border-yellow-200">
                        <i data-lucide="star" class="text-slate-300 peer-checked:text-yellow-500 mb-1" width="24"></i>
                        <span class="text-[9px] font-black text-slate-400 peer-checked:text-yellow-600 uppercase">Xuất sắc</span>
                    </div>
                </label>
                
                <label class="cursor-pointer group relative">
                    <input type="radio" name="rating_type" value="LIKE" class="peer sr-only" checked>
                    <div class="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-slate-100 bg-slate-50 peer-checked:border-blue-500 peer-checked:bg-blue-50 transition-all group-hover:border-blue-200">
                        <i data-lucide="thumbs-up" class="text-slate-300 peer-checked:text-blue-500 mb-1" width="24"></i>
                        <span class="text-[9px] font-black text-slate-400 peer-checked:text-blue-600 uppercase">Tốt</span>
                    </div>
                </label>

                <label class="cursor-pointer group relative">
                    <input type="radio" name="rating_type" value="DISLIKE" class="peer sr-only">
                    <div class="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-slate-100 bg-slate-50 peer-checked:border-rose-500 peer-checked:bg-rose-50 transition-all group-hover:border-rose-200">
                        <i data-lucide="thumbs-down" class="text-slate-300 peer-checked:text-rose-500 mb-1" width="24"></i>
                        <span class="text-[9px] font-black text-slate-400 peer-checked:text-rose-600 uppercase">Kém</span>
                    </div>
                </label>
            </div>

            <div class="mb-6">
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lý do / Nhận xét</label>
                <textarea id="rating-note" rows="3" required class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 focus:ring-0 focus:border-indigo-500 outline-none resize-none placeholder:font-normal transition-all" placeholder="Nhập nhận xét chi tiết..."></textarea>
            </div>

            <button type="submit" class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all">
                Lưu đánh giá
            </button>
        </form>
    </div>
</div>