/**
 * js/controller/ranking.controller.js
 * Quản lý logic hiển thị Bảng xếp hạng nhân sự và Chi tiết đánh giá
 */
const RankingController = {
    currentPeriod: 'month',

    init: () => {
        RankingController.loadData(RankingController.currentPeriod);
    },

    loadData: async (period) => {
        RankingController.currentPeriod = period;

        // Cập nhật UI nút bấm
        document.querySelectorAll('.ranking-period-btn').forEach(btn => {
            if (btn.getAttribute('onclick').includes(period)) {
                btn.className = 'ranking-period-btn px-6 py-2.5 text-xs font-black rounded-xl transition-all bg-indigo-600 text-white shadow-md shadow-indigo-200';
            } else {
                btn.className = 'ranking-period-btn px-6 py-2.5 text-xs font-black rounded-xl transition-all bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-100 shadow-sm';
            }
        });

        const top3Container = document.getElementById('podium-container');
        if (top3Container) {
            top3Container.innerHTML = '<div class="w-full text-center animate-pulse text-indigo-300 font-bold text-xs uppercase tracking-widest">Đang tải dữ liệu...</div>';
        }

        const res = await Utils.callApi('fetch_leaderboard', { period: period });
        if (res.status === 'success') {
            RankingController.renderUI(res.data);
        } else {
            if (top3Container) {
                top3Container.innerHTML = `<div class="w-full text-center text-rose-500 font-black uppercase text-sm bg-rose-50 p-4 rounded-xl border border-rose-100">⚠️ Lỗi: ${res.message || 'Không rõ nguyên nhân'}</div>`;
            }
        }
    },

    renderUI: (data) => {
        const top3Container = document.getElementById('podium-container');
        const listContainer = document.getElementById('ranking-list-container');

        if (!data || data.length === 0) {
            top3Container.innerHTML = '<div class="col-span-3 text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-xs">Chưa có dữ liệu đánh giá</div>';
            listContainer.innerHTML = '';
            return;
        }

        // Lấy Top 3
        const top3 = data.slice(0, 3);
        const rest = data.slice(3);

        // 1. Render Bục vinh danh (Top 3)
        let podiumHtml = '';
        const order = [1, 0, 2]; // Index 1(Hạng 2), Index 0(Hạng 1), Index 2(Hạng 3)

        order.forEach((index) => {
            const user = top3[index];
            if (!user) {
                podiumHtml += `<div class="flex-1"></div>`;
                return;
            }

            const rank = index + 1;
            const isTop1 = rank === 1;
            const heightClass = isTop1 ? 'h-48' : (rank === 2 ? 'h-40' : 'h-32');
            const colorClass = isTop1 ? 'from-amber-400 to-orange-500 shadow-amber-200' : (rank === 2 ? 'from-slate-300 to-slate-400 shadow-slate-200' : 'from-amber-600 to-orange-700 shadow-orange-200/50');
            const medalIcon = isTop1 ? '👑' : (rank === 2 ? '🥈' : '🥉');
            const avatar = user.avatar ? user.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`;

            // Mã hóa chuỗi để chống lỗi Syntax Error khi gắn vào HTML
            const safeName = encodeURIComponent(user.fullName || '');
            const safeAvatar = encodeURIComponent(avatar || '');

            podiumHtml += `
            <div onclick="RankingController.showUserDetails(${user.id}, '${safeName}', '${safeAvatar}')" class="flex-1 flex flex-col items-center justify-end animate-in slide-in-from-bottom-8 duration-700 cursor-pointer hover:-translate-y-2 transition-transform" style="animation-delay: ${isTop1 ? '0ms' : '200ms'}">
                <div class="relative mb-4 group cursor-pointer">
                    <div class="absolute -top-4 -right-3 text-3xl z-20 ${isTop1 ? 'animate-bounce' : ''}">${medalIcon}</div>
                    <img src="${avatar}" class="${isTop1 ? 'w-24 h-24 border-4' : 'w-20 h-20 border-[3px]'} border-white rounded-full object-cover shadow-xl group-hover:scale-110 transition-transform">
                </div>
                <h3 class="font-black text-slate-800 text-sm uppercase text-center tracking-tight mb-1 line-clamp-1">${user.fullName}</h3>
                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center mb-4 line-clamp-1 px-2">${user.department_name}</p>
                
                <div class="w-full bg-gradient-to-t ${colorClass} rounded-t-[32px] ${heightClass} shadow-xl flex flex-col items-center justify-start pt-6 text-white">
                    <span class="text-3xl font-[1000] opacity-90">${user.score}</span>
                    <span class="text-[9px] font-black uppercase tracking-widest opacity-70 mt-1">Điểm KPI</span>
                </div>
            </div>`;
        });
        top3Container.innerHTML = podiumHtml;

        // 2. Render Danh sách (Hạng 4 trở đi)
        if (rest.length === 0) {
            listContainer.innerHTML = '<div class="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-xs">Không có nhân sự nào khác</div>';
            return;
        }

        let listHtml = '';
        rest.forEach((user, index) => {
            const rank = index + 4;
            const avatar = user.avatar ? user.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`;

            // Mã hóa chuỗi an toàn
            const safeName = encodeURIComponent(user.fullName || '');
            const safeAvatar = encodeURIComponent(avatar || '');

            listHtml += `
            <div onclick="RankingController.showUserDetails(${user.id}, '${safeName}', '${safeAvatar}')" class="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-50 shadow-sm hover:shadow-md transition-all hover:border-indigo-100 animate-in fade-in slide-in-from-right-4 cursor-pointer group">
                <div class="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center font-[1000] text-lg shrink-0 border border-slate-100">
                    #${rank}
                </div>
                
                <img src="${avatar}" class="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-100 shrink-0">
                
                <div class="flex-1 min-w-0">
                    <h4 class="font-black text-slate-800 text-sm uppercase truncate">${user.fullName}</h4>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">${user.department_name}</p>
                </div>
                
                <div class="hidden md:flex items-center gap-6 mr-6">
                    <div class="text-center"><div class="text-sm font-[1000] text-emerald-500">${user.done_tasks}</div><div class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Đã xong</div></div>
                    <div class="text-center"><div class="text-sm font-[1000] text-rose-500">${user.late_tasks}</div><div class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Trễ hạn</div></div>
                </div>
                
                <div class="bg-[#eff6ff] text-indigo-600 px-4 py-2 rounded-xl text-center shrink-0">
                    <div class="text-lg font-[1000] leading-none">${user.score}</div>
                    <div class="text-[8px] font-black uppercase tracking-widest opacity-70 mt-1">ĐIỂM</div>
                </div>
            </div>`;
        });
        listContainer.innerHTML = listHtml;
    },

    showUserDetails: async (userId, encodedName, encodedAvatar) => {
        // Giải mã chuỗi đã mã hóa
        const userName = decodeURIComponent(encodedName);
        const avatar = decodeURIComponent(encodedAvatar);

        const modal = document.getElementById('ranking-detail-modal');
        const content = document.getElementById('ranking-detail-content');

        // Điền Header
        document.getElementById('ranking-detail-name').innerText = userName;
        document.getElementById('ranking-detail-avatar').src = avatar;

        // Mở Modal và hiện Loading
        modal.classList.remove('hidden');
        content.innerHTML = '<div class="text-center py-10 animate-pulse font-bold text-indigo-400 text-sm uppercase tracking-widest"><i data-lucide="loader-2" class="animate-spin inline-block w-6 h-6 mb-2"></i><br>Đang lấy dữ liệu...</div>';
        if (window.lucide) lucide.createIcons();

        // Gọi API
        const res = await Utils.callApi('fetch_user_ranking_details', { user_id: userId });

        if (res.status === 'success') {
            const d = res;

            // Xử lý hiển thị đánh giá
            let evalHtml = '';
            
            if (d.total_evals === -1) {
                // Nếu Backend báo lỗi SQL
                evalHtml = `<div class="text-[10px] text-rose-500 font-bold text-center mt-2 bg-rose-50 p-2 rounded-lg">Lỗi SQL: Vui lòng kiểm tra lại tên cột trong bảng evaluations</div>`;
            } else {
                // Vẽ giao diện đánh giá dựa trên các key Backend trả về
                let itemsHtml = '';
                
                // Bảng màu tự động cho các loại đánh giá phổ biến
                const colorMap = {
                    'Tốt': 'text-emerald-500', 'Xuất sắc': 'text-emerald-500',
                    'Khá': 'text-amber-500', 'Bình thường': 'text-amber-500',
                    'Kém': 'text-rose-500', 'Cần cố gắng': 'text-rose-500'
                };
                
                const keys = Object.keys(d.evals);
                keys.forEach((key, idx) => {
                    const val = d.evals[key];
                    const colorClass = colorMap[key] || 'text-indigo-500'; // Nếu có loại khác thì cho màu xanh dương
                    const borderClass = idx < keys.length - 1 ? 'border-r border-slate-100' : '';
                    
                    itemsHtml += `
                        <div class="text-center flex-1 py-1 ${borderClass}">
                            <div class="text-xl font-[1000] ${colorClass}">${val}</div>
                            <div class="text-[9px] font-black uppercase text-slate-400 mt-0.5">${key}</div>
                        </div>
                    `;
                });

                evalHtml = `
                    <div class="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm mt-3">
                        ${itemsHtml}
                    </div>
                `;
            }

            // Render Nội dung
            content.innerHTML = `
                <div class="space-y-4 font-['Lexend']">
                    <div>
                        <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Thống kê công việc</h4>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><i data-lucide="check-circle" width="20"></i></div>
                                <div>
                                    <div class="text-2xl font-[1000] text-emerald-600 leading-none">${d.on_time}</div>
                                    <div class="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Xong trước/đúng hạn</div>
                                </div>
                            </div>
                            <div class="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0"><i data-lucide="clock" width="20"></i></div>
                                <div>
                                    <div class="text-2xl font-[1000] text-rose-600 leading-none">${d.late}</div>
                                    <div class="text-[9px] font-bold text-rose-500 uppercase tracking-widest mt-1">Xong trễ hạn</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="pt-2">
                        <div class="flex items-center justify-between">
                            <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400">Thống kê đánh giá</h4>
                            <span class="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">Tổng: ${d.total_evals === -1 ? 0 : d.total_evals} lượt</span>
                        </div>
                        ${evalHtml}
                    </div>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
        } else {
            content.innerHTML = `<div class="text-center text-rose-500 font-bold text-sm bg-rose-50 p-4 rounded-xl">Lỗi: ${res.message}</div>`;
        }
    },

    closeModal: () => {
        document.getElementById('ranking-detail-modal')?.classList.add('hidden');
    }
};

// Khởi tạo ngay khi script load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('ranking-view-container')) {
        RankingController.init();
    }
});