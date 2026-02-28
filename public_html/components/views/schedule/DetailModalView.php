<div id="detail-modal" class="fixed inset-0 z-[10010] flex items-center justify-center hidden font-['Lexend'] p-4">
    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onclick="DetailService.close()"></div>
    <div class="relative bg-white rounded-[24px] w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        
        <div class="text-center mb-6 pb-4 border-b border-slate-100">
            <h3 id="detail-title" class="text-xl font-black text-slate-800 uppercase tracking-tight">--</h3>
            <p id="detail-type-badge" class="text-[10px] font-bold uppercase tracking-widest mt-2 px-3 py-1 rounded-md inline-block">--</p>
        </div>

        <div id="detail-event-info" class="hidden space-y-4">
            <div class="flex justify-between items-center bg-indigo-50 p-3 rounded-xl"><span class="text-[10px] font-black text-indigo-400 uppercase">Người tạo</span><span id="detail-creator" class="text-xs font-black text-indigo-700">--</span></div>
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-slate-50 p-3 rounded-xl"><div class="text-[9px] font-black text-slate-400 uppercase">Bắt đầu</div><div id="detail-event-start" class="text-xs font-bold text-slate-700 mt-1">--</div></div>
                <div class="bg-slate-50 p-3 rounded-xl"><div class="text-[9px] font-black text-slate-400 uppercase">Kết thúc</div><div id="detail-event-end" class="text-xs font-bold text-slate-700 mt-1">--</div></div>
            </div>
        </div>

        <div id="detail-leave-info" class="hidden space-y-4">
            <div class="flex items-center gap-3 mb-2">
                <div class="w-10 h-10 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center"><i data-lucide="user" width="20"></i></div>
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Người làm đơn</p>
                    <p id="detail-leave-requester" class="text-sm font-black text-slate-800">--</p>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-100"><span class="text-[9px] font-black text-slate-400 uppercase">Nghỉ từ ngày</span><div id="detail-leave-start" class="text-xs font-bold text-slate-800 mt-1">--</div></div>
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-100"><span class="text-[9px] font-black text-slate-400 uppercase">Đến ngày</span><div id="detail-leave-end" class="text-xs font-bold text-slate-800 mt-1">--</div></div>
            </div>
            <div class="bg-amber-50/50 p-3 rounded-xl border border-amber-100 flex justify-between items-center">
                <span class="text-[9px] font-black text-amber-500 uppercase tracking-widest">Trạng thái</span>
                <span id="detail-leave-status" class="text-xs font-black px-2 py-0.5 rounded uppercase">--</span>
            </div>
            <div class="text-xs text-slate-500 mt-2">
                <p><strong>Người duyệt:</strong> <span id="detail-leave-manager">--</span></p>
                <p class="mt-1"><strong>CC:</strong> <span id="detail-leave-followers" class="text-slate-400">--</span></p>
            </div>
            
            <div id="detail-leave-manager-note-wrapper" class="hidden bg-slate-100 p-4 rounded-xl border border-slate-200 mt-4 relative overflow-hidden">
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
                <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
                    <i data-lucide="message-square" width="12"></i> Sếp phản hồi:
                </span>
                <p id="detail-leave-manager-note-text" class="text-sm text-slate-700 italic font-medium leading-relaxed">--</p>
            </div>
        </div>

        <div id="detail-leave-reason-wrapper" class="mt-5 pt-5 border-t border-slate-100">
            <div id="detail-content-label" class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <i data-lucide="align-left" width="12"></i> Lý do chi tiết
            </div>
            <div id="detail-content" class="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed shadow-inner">--</div>
        </div>

        <div class="mt-6" id="detail-default-actions">
            <button onclick="DetailService.close()" class="w-full py-3 bg-slate-100 text-slate-600 font-black text-xs uppercase rounded-xl hover:bg-slate-200">Đóng Cửa Sổ</button>
        </div>

        <div class="mt-6 flex flex-col gap-3 hidden" id="detail-leave-actions">
            <textarea id="detail-manager-note-input" rows="2" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-300 resize-none" placeholder="Nhập ghi chú phản hồi cho nhân viên (không bắt buộc)..."></textarea>
            <div class="grid grid-cols-2 gap-3">
                <button onclick="DetailService.processLeave('REJECTED')" class="py-3 bg-rose-50 text-rose-500 border border-rose-200 font-black text-xs uppercase rounded-xl hover:bg-rose-100">Từ chối</button>
                <button onclick="DetailService.processLeave('APPROVED')" class="py-3 bg-emerald-500 text-white font-black text-xs uppercase rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-200">Phê duyệt</button>
            </div>
        </div>
    </div>
</div>