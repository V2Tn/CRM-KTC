/**
 * js/controller/ranking.controller.js
 */
const RankingController = {
    currentPeriod: 'month',
    pickerYear: new Date().getFullYear(),

    init: () => {
        RankingController.renderMonthPicker();
        RankingController.loadData(RankingController.currentPeriod);
    },

    // ==========================================
    // LOGIC VẼ LỊCH CHỌN THÁNG CUSTOM
    // ==========================================
    renderMonthPicker: () => {
        const display = document.getElementById('ranking-year-display');
        if (display) display.innerText = RankingController.pickerYear;
        
        const grid = document.getElementById('ranking-months-grid');
        if (!grid) return;
        
        let html = '';
        for (let i = 1; i <= 12; i++) {
            const monthVal = `${RankingController.pickerYear}-${String(i).padStart(2, '0')}`;
            html += `<button onclick="RankingController.loadCustomMonth('${monthVal}', ${i})" class="py-2.5 rounded-xl text-xs font-bold transition-all bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent hover:border-indigo-100">T${i}</button>`;
        }
        grid.innerHTML = html;
    },

    changeYear: (offset) => {
        RankingController.pickerYear += offset;
        RankingController.renderMonthPicker();
    },

    // ==========================================
    // LOGIC XỬ LÝ LOAD DỮ LIỆU CHÍNH
    // ==========================================
    loadData: async (period) => {
        RankingController.currentPeriod = period;

        // Đặt lại text cho nút nếu bấm về mặc định
        const customLabel = document.getElementById('ranking-custom-label');
        if (customLabel && ['week', 'month', 'year'].includes(period)) {
            customLabel.innerText = 'Chọn tháng';
        }

        // Đóng dropdown nếu đang mở
        const dropdown = document.getElementById('ranking-month-dropdown');
        if (dropdown && !dropdown.classList.contains('hidden')) toggleCustomDropdown('ranking-month-dropdown');

        // Reset màu nút bấm
        document.querySelectorAll('.ranking-period-btn').forEach(btn => {
            btn.className = 'ranking-period-btn px-5 py-2.5 text-xs font-black rounded-xl transition-all bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-100 shadow-sm flex items-center gap-2';
            if (btn.id === `btn-period-${period}`) {
                btn.className = 'ranking-period-btn px-5 py-2.5 text-xs font-black rounded-xl transition-all bg-indigo-600 text-white shadow-md shadow-indigo-200 flex items-center gap-2';
            }
        });

        const top3Container = document.getElementById('podium-container');
        if (top3Container) top3Container.innerHTML = '<div class="w-full text-center animate-pulse text-indigo-300 font-bold text-xs uppercase tracking-widest">Đang tải dữ liệu...</div>';

        const res = await Utils.callApi('fetch_leaderboard', { period: period });
        if (res.status === 'success') {
            RankingController.renderUI(res.data);
            if (window.lucide) lucide.createIcons();
        } else {
            if (top3Container) top3Container.innerHTML = `<div class="w-full text-center text-rose-500 font-black uppercase text-sm bg-rose-50 p-4 rounded-xl border border-rose-100">Lỗi: ${res.message}</div>`;
        }
    },

    loadCustomMonth: async (monthValue, monthNumber) => {
        document.getElementById('ranking-custom-label').innerText = `Tháng ${monthNumber}/${RankingController.pickerYear}`;
        toggleCustomDropdown('ranking-month-dropdown');
        
        document.querySelectorAll('.ranking-period-btn').forEach(btn => {
            btn.className = 'ranking-period-btn px-5 py-2.5 text-xs font-black rounded-xl transition-all bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-100 shadow-sm flex items-center gap-2';
        });
        document.getElementById('btn-period-custom').className = 'ranking-period-btn px-5 py-2.5 text-xs font-black rounded-xl transition-all bg-indigo-600 text-white shadow-md shadow-indigo-200 flex items-center gap-2';

        RankingController.currentPeriod = monthValue;
        const top3Container = document.getElementById('podium-container');
        if (top3Container) top3Container.innerHTML = '<div class="w-full text-center animate-pulse text-indigo-300 font-bold text-xs uppercase tracking-widest">Đang tải dữ liệu...</div>';

        const res = await Utils.callApi('fetch_leaderboard', { period: monthValue });
        if (res.status === 'success') {
            RankingController.renderUI(res.data);
            if (window.lucide) lucide.createIcons();
        }
    },

    // ==========================================
    // LOGIC MODAL CHI TIẾT (ĐÃ FIX BUG 0 ĐIỂM)
    // ==========================================
    showUserDetails: async (userId, encodedName, encodedAvatar) => {
        const userName = decodeURIComponent(encodedName);
        const avatar = decodeURIComponent(encodedAvatar);

        const modal = document.getElementById('ranking-detail-modal');
        const content = document.getElementById('ranking-detail-content');

        document.getElementById('ranking-detail-name').innerText = userName;
        document.getElementById('ranking-detail-avatar').src = avatar;

        modal.classList.remove('hidden');
        content.innerHTML = '<div class="text-center py-10 animate-pulse font-bold text-indigo-400 text-sm uppercase tracking-widest"><i data-lucide="loader-2" class="animate-spin inline-block w-6 h-6 mb-2"></i><br>Đang lấy dữ liệu...</div>';
        if (window.lucide) lucide.createIcons();
        const res = await Utils.callApi('fetch_user_ranking_details', { 
            user_id: userId,
            period: RankingController.currentPeriod
        });

        if (res.status === 'success') {
            const d = res;

            // TÍNH TOÁN % CÔNG VIỆC
            const totalResolved = d.on_time + d.late + d.canceled;

            // Tính width % cho thanh Progress bar
            const onTimePctWidth = totalResolved > 0 ? (d.on_time / totalResolved) * 100 : 0;
            const latePctWidth = totalResolved > 0 ? (d.late / totalResolved) * 100 : 0;
            const cancelPctWidth = totalResolved > 0 ? (d.canceled / totalResolved) * 100 : 0;

            // Tính số % làm tròn để hiển thị dạng Text
            const onTimeDisplay = Math.round(onTimePctWidth);
            const lateDisplay = Math.round(latePctWidth);
            const cancelDisplay = Math.round(cancelPctWidth);

            // XỬ LÝ HIỂN THỊ ĐÁNH GIÁ (SAO)
            let evalHtml = '';
            if (d.total_evals === -1) {
                evalHtml = `<div class="text-[10px] text-rose-500 font-bold text-center mt-2 bg-rose-50 p-2 rounded-lg">Lỗi truy vấn SQL</div>`;
            } else {
                let itemsHtml = '';
                const colorMap = { 'Tốt': 'text-emerald-500', 'Xuất sắc': 'text-yellow-500', 'Kém': 'text-rose-500' };
                const keys = Object.keys(d.evals);
                keys.forEach((key, idx) => {
                    const val = d.evals[key];
                    const colorClass = colorMap[key] || 'text-indigo-500';
                    const borderClass = idx < keys.length - 1 ? 'border-r border-slate-100' : '';
                    itemsHtml += `<div class="text-center flex-1 py-1 ${borderClass}"><div class="text-xl font-[1000] ${colorClass}">${val}</div><div class="text-[9px] font-black uppercase text-slate-400 mt-0.5">${key}</div></div>`;
                });
                evalHtml = `<div class="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm mt-3">${itemsHtml}</div>`;
            }

            // XỬ LÝ HIỂN THỊ NHẬN XÉT CỦA SẾP
            let notesHtml = '';
            if (d.eval_notes && d.eval_notes.length > 0) {
                const notesList = d.eval_notes.map(n => {
                    let colorClass = 'text-indigo-500 bg-indigo-50 border-indigo-100';
                    let icon = 'star';
                    if (n.type === 'Xuất sắc') { colorClass = 'text-yellow-600 bg-yellow-50 border-yellow-100'; icon = 'star'; }
                    else if (n.type === 'Tốt') { colorClass = 'text-emerald-600 bg-emerald-50 border-emerald-100'; icon = 'thumbs-up'; }
                    else if (n.type === 'Kém') { colorClass = 'text-rose-600 bg-rose-50 border-rose-100'; icon = 'thumbs-down'; }

                    return `
                    <div class="bg-white p-3 rounded-xl border border-slate-100 shadow-sm mb-2 hover:shadow-md transition-all">
                        <div class="flex justify-between items-start mb-1.5">
                            <span class="text-[10px] font-black uppercase text-slate-500"><i data-lucide="user" width="10" class="inline"></i> Sếp: ${n.manager}</span>
                            <span class="text-[9px] font-bold text-slate-400">${n.date}</span>
                        </div>
                        <div class="flex gap-2 items-start">
                            <div class="shrink-0 p-1.5 rounded-lg border ${colorClass} mt-0.5">
                                <i data-lucide="${icon}" width="12"></i>
                            </div>
                            <p class="text-xs font-medium text-slate-700 italic leading-relaxed">"${n.note}"</p>
                        </div>
                    </div>`;
                }).join('');

                notesHtml = `
                <div class="pt-4 border-t border-slate-200">
                    <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5"><i data-lucide="message-square" width="14"></i> Nhận xét chi tiết</h4>
                    <div class="max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                        ${notesList}
                    </div>
                </div>`;
            }

            // GẮN VÀO HTML
            content.innerHTML = `
                <div class="space-y-4 font-['Lexend']">
                    <div>
                        <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Thống kê công việc</h4>
                        
                        <div class="mb-3 bg-slate-100 rounded-full h-2 flex overflow-hidden shadow-inner w-full">
                            <div class="bg-emerald-400 h-full transition-all duration-500" style="width: ${onTimePctWidth}%" title="Đúng hạn"></div>
                            <div class="bg-rose-400 h-full transition-all duration-500" style="width: ${latePctWidth}%" title="Trễ hạn"></div>
                            <div class="bg-slate-400 h-full transition-all duration-500" style="width: ${cancelPctWidth}%" title="Đã hủy"></div>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div class="bg-indigo-50 border border-indigo-100 p-3 rounded-2xl flex flex-col justify-center items-center text-center relative overflow-hidden group">
                                <div class="absolute -right-3 -top-3 opacity-10 group-hover:scale-110 transition-transform"><i data-lucide="list-todo" width="50"></i></div>
                                <div class="text-2xl font-[1000] text-indigo-600 leading-none mb-1">${d.total_tasks}</div>
                                <div class="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Tổng</div>
                            </div>
                            <div class="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex flex-col justify-center items-center text-center relative overflow-hidden group">
                                <div class="absolute -right-3 -top-3 opacity-10 group-hover:scale-110 transition-transform"><i data-lucide="check-circle" width="50"></i></div>
                                <div class="text-2xl font-[1000] text-emerald-600 leading-none mb-1">${d.on_time} <span class="text-xs font-bold text-emerald-400 bg-emerald-100/50 px-1 py-0.5 rounded-md align-middle">(${onTimeDisplay}%)</span></div>
                                <div class="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Đúng hạn</div>
                            </div>
                            <div class="bg-rose-50 border border-rose-100 p-3 rounded-2xl flex flex-col justify-center items-center text-center relative overflow-hidden group">
                                <div class="absolute -right-3 -top-3 opacity-10 group-hover:scale-110 transition-transform"><i data-lucide="clock" width="50"></i></div>
                                <div class="text-2xl font-[1000] text-rose-600 leading-none mb-1">${d.late} <span class="text-xs font-bold text-rose-400 bg-rose-100/50 px-1 py-0.5 rounded-md align-middle">(${lateDisplay}%)</span></div>
                                <div class="text-[9px] font-bold text-rose-500 uppercase tracking-widest">Trễ hạn</div>
                            </div>
                            <div class="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex flex-col justify-center items-center text-center relative overflow-hidden group">
                                <div class="absolute -right-3 -top-3 opacity-10 group-hover:scale-110 transition-transform"><i data-lucide="x-circle" width="50"></i></div>
                                <div class="text-2xl font-[1000] text-slate-600 leading-none mb-1">${d.canceled} <span class="text-xs font-bold text-slate-400 bg-slate-200/50 px-1 py-0.5 rounded-md align-middle">(${cancelDisplay}%)</span></div>
                                <div class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Việc bị hủy</div>
                            </div>
                        </div>
                    </div>

                    <div class="pt-2 border-t border-slate-200">
                        <div class="flex items-center justify-between">
                            <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400">Thống kê đánh giá</h4>
                            <span class="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">Tổng: ${d.total_evals === -1 ? 0 : d.total_evals} lượt</span>
                        </div>
                        ${evalHtml}
                    </div>
                    
                    ${notesHtml}
                </div>
            `;
            if (window.lucide) lucide.createIcons();
        } else {
            content.innerHTML = `<div class="text-center text-rose-500 font-bold text-sm bg-rose-50 p-4 rounded-xl">Lỗi: ${res.message}</div>`;
        }
    },

    closeModal: () => document.getElementById('ranking-detail-modal')?.classList.add('hidden'),

    // Gắn luồng render UI gốc của em
    renderUI: (data) => {
        const top3Container = document.getElementById('podium-container');
        const listContainer = document.getElementById('ranking-list-container');
        if (!data || data.length === 0) {
            top3Container.innerHTML = '<div class="col-span-3 text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-xs">Chưa có dữ liệu đánh giá</div>';
            listContainer.innerHTML = '';
            return;
        }
        const top3 = data.slice(0, 3);
        const rest = data.slice(3);
        let podiumHtml = '';
        const order = [1, 0, 2];
        order.forEach((index) => {
            const user = top3[index];
            if (!user) { podiumHtml += `<div class="flex-1"></div>`; return; }
            const rank = index + 1;
            const isTop1 = rank === 1;
            const heightClass = isTop1 ? 'h-48' : (rank === 2 ? 'h-40' : 'h-32');
            const colorClass = isTop1 ? 'from-amber-400 to-orange-500 shadow-amber-200' : (rank === 2 ? 'from-slate-300 to-slate-400 shadow-slate-200' : 'from-amber-600 to-orange-700 shadow-orange-200/50');
            const medalIcon = isTop1 ? '👑' : (rank === 2 ? '🥈' : '🥉');
            const avatar = user.avatar ? user.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`;
            const safeName = encodeURIComponent(user.fullName || '');
            const safeAvatar = encodeURIComponent(avatar || '');
            podiumHtml += `
            <div onclick="RankingController.showUserDetails(${user.id}, '${safeName}', '${safeAvatar}')" class="flex-1 flex flex-col items-center justify-end animate-in slide-in-from-bottom-8 duration-700 cursor-pointer hover:-translate-y-2 transition-transform" style="animation-delay: ${isTop1 ? '0ms' : '200ms'}">
                <div class="relative mb-4 group cursor-pointer"><div class="absolute -top-4 -right-3 text-3xl z-20 ${isTop1 ? 'animate-bounce' : ''}">${medalIcon}</div><img src="${avatar}" class="${isTop1 ? 'w-24 h-24 border-4' : 'w-20 h-20 border-[3px]'} border-white rounded-full object-cover shadow-xl group-hover:scale-110 transition-transform"></div>
                <h3 class="font-black text-slate-800 text-sm uppercase text-center tracking-tight mb-1 line-clamp-1">${user.fullName}</h3><p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center mb-4 line-clamp-1 px-2">${user.department_name}</p>
                <div class="w-full bg-gradient-to-t ${colorClass} rounded-t-[32px] ${heightClass} shadow-xl flex flex-col items-center justify-start pt-6 text-white"><span class="text-3xl font-[1000] opacity-90">${user.score}</span><span class="text-[9px] font-black uppercase tracking-widest opacity-70 mt-1">Điểm KPI</span></div>
            </div>`;
        });
        top3Container.innerHTML = podiumHtml;
        if (rest.length === 0) { listContainer.innerHTML = '<div class="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-xs">Không có nhân sự nào khác</div>'; return; }
        let listHtml = '';
        rest.forEach((user, index) => {
            const rank = index + 4;
            const avatar = user.avatar ? user.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`;
            const safeName = encodeURIComponent(user.fullName || '');
            const safeAvatar = encodeURIComponent(avatar || '');
            listHtml += `
            <div onclick="RankingController.showUserDetails(${user.id}, '${safeName}', '${safeAvatar}')" class="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-50 shadow-sm hover:shadow-md transition-all hover:border-indigo-100 animate-in fade-in slide-in-from-right-4 cursor-pointer group">
                <div class="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center font-[1000] text-lg shrink-0 border border-slate-100">#${rank}</div>
                <img src="${avatar}" class="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-100 shrink-0">
                <div class="flex-1 min-w-0"><h4 class="font-black text-slate-800 text-sm uppercase truncate">${user.fullName}</h4><p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">${user.department_name}</p></div>
                <div class="hidden md:flex items-center gap-6 mr-6"><div class="text-center"><div class="text-sm font-[1000] text-emerald-500">${user.done_tasks}</div><div class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Đã xong</div></div><div class="text-center"><div class="text-sm font-[1000] text-rose-500">${user.late_tasks}</div><div class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Trễ hạn</div></div></div>
                <div class="bg-[#eff6ff] text-indigo-600 px-4 py-2 rounded-xl text-center shrink-0"><div class="text-lg font-[1000] leading-none">${user.score}</div><div class="text-[8px] font-black uppercase tracking-widest opacity-70 mt-1">ĐIỂM</div></div>
            </div>`;
        });
        listContainer.innerHTML = listHtml;
    }
};

document.addEventListener('DOMContentLoaded', () => { if (document.getElementById('ranking-view-container')) RankingController.init(); });