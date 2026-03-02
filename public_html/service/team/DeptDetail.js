window.TeamDeptDetailService = {
    render: (members, deptName) => {
        const container = document.getElementById('view-dept-detail');
        if (!container) return;

        container.classList.remove('hidden');
        document.getElementById('view-departments')?.classList.add('hidden');
        document.getElementById('view-member-detail')?.classList.add('hidden');

        const titleEl = document.getElementById('team-page-title');
        if (titleEl) titleEl.innerText = deptName.toUpperCase();

        if (TeamController.state.role !== 'MANAGER') {
            document.getElementById('btn-team-back')?.classList.remove('hidden');
        }

        // =========================================================
        // BƯỚC 1: TÍNH TOÁN DATA CHUẨN
        // =========================================================
        const processedMembers = members.map(m => {
            const doneTotal = parseInt(m.count_done) || 0;
            const doneOnTime = parseInt(m.count_done_on_time) || 0;
            const activeOverdue = parseInt(m.count_overdue) || 0;
            const activeTasks = (parseInt(m.count_new) || 0) + (parseInt(m.count_doing) || 0);
            const totalTasks = parseInt(m.total_tasks) || 0;

            const totalLate = (doneTotal - doneOnTime) + activeOverdue;

            let progressRate = totalTasks > 0 ? Math.round((doneOnTime / totalTasks) * 100) : 0;
            progressRate = Math.min(progressRate, 100);

            let lateRate = totalTasks > 0 ? Math.round((totalLate / totalTasks) * 100) : 0;
            lateRate = Math.min(lateRate, 100);

            const safeName = m.fullName.replace(/'/g, "\\'");
            const avatarSrc = m.avatar ? m.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(m.fullName)}&background=random&size=100`;

            return {
                ...m,
                doneTotal, doneOnTime, activeOverdue, activeTasks, totalTasks, totalLate, progressRate, lateRate, safeName, avatarSrc
            };
        });

        // =========================================================
        // BƯỚC 2: XỬ LÝ DỮ LIỆU CHO 3 TAB BẢNG XẾP HẠNG
        // =========================================================

        const topGood = [...processedMembers]
            .filter(m => m.totalTasks > 0)
            .sort((a, b) => {
                if (b.progressRate !== a.progressRate) return b.progressRate - a.progressRate;
                return b.doneOnTime - a.doneOnTime;
            }).slice(0, 3);

        const topBad = [...processedMembers]
            .filter(m => m.totalTasks > 0 && m.lateRate > 0)
            .sort((a, b) => {
                if (b.lateRate !== a.lateRate) return b.lateRate - a.lateRate;
                return b.totalLate - a.totalLate;
            }).slice(0, 3);

        const topVolume = [...processedMembers]
            .filter(m => m.totalTasks > 0)
            .sort((a, b) => {
                if (b.totalTasks !== a.totalTasks) return b.totalTasks - a.totalTasks;
                return b.doneOnTime - a.doneOnTime;
            }).slice(0, 3);
        const maxTotalVolume = topVolume.length > 0 ? topVolume[0].totalTasks : 1;

        // =========================================================
        // BƯỚC 3: RENDER GIAO DIỆN BẢNG XẾP HẠNG GỘP (TAB)
        // =========================================================
        let leaderboardHtml = '';
        if (topGood.length > 0 || topBad.length > 0 || topVolume.length > 0) {

            let goodHtml = '<div class="text-center text-slate-400 py-6 text-[11px] font-bold border-2 border-dashed border-slate-100 rounded-2xl">Chưa có ai hoàn thành việc đúng hạn</div>';
            if (topGood.length > 0) {
                goodHtml = topGood.map((m, index) => {
                    let medalColor = index === 0 ? 'text-yellow-600 bg-yellow-100 border-yellow-300' : (index === 1 ? 'text-slate-500 bg-slate-100 border-slate-300' : 'text-amber-700 bg-amber-100 border-amber-300');
                    let barColor = m.progressRate >= 80 ? 'bg-emerald-500' : (m.progressRate >= 50 ? 'bg-amber-400' : 'bg-rose-500');
                    let relativeWidth = Math.max(m.progressRate, 8);

                    return `
                    <div class="flex items-center gap-4 group cursor-pointer p-2 hover:bg-emerald-50/50 rounded-2xl transition-colors" onclick="TeamController.openMember(${m.id})">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center border shadow-sm shrink-0 ${medalColor} font-black text-[11px]">#${index + 1}</div>
                        <img src="${m.avatarSrc}" class="w-10 h-10 rounded-full object-cover border border-white shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                        <div class="w-32 md:w-40 shrink-0">
                            <h4 class="text-xs font-black text-slate-800 uppercase truncate group-hover:text-emerald-600 transition-colors" title="${m.fullName}">${m.fullName}</h4>
                            <p class="text-[10px] font-bold text-slate-500 mt-0.5">Xong đúng <b class="text-emerald-600">${m.doneOnTime}/${m.totalTasks}</b> việc</p>
                        </div>
                        <div class="flex-1 h-7 bg-slate-50 rounded-full overflow-hidden relative flex items-center border border-slate-100/50 shadow-inner">
                            <div class="h-full ${barColor} rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2.5" style="width: 0%" data-chart-width="${relativeWidth}%">
                                <span class="text-[10px] font-[900] text-white drop-shadow-sm">${m.progressRate}%</span>
                            </div>
                        </div>
                    </div>`;
                }).join('');
            }

            let badHtml = '<div class="text-center text-emerald-500 py-6 text-[11px] font-black uppercase tracking-widest border-2 border-dashed border-emerald-100 bg-emerald-50 rounded-2xl"><i data-lucide="party-popper" class="inline mb-1" width="18"></i> Tuyệt vời, không ai bị trễ hạn!</div>';
            if (topBad.length > 0) {
                badHtml = topBad.map((m, index) => {
                    let relativeWidth = Math.max(m.lateRate, 8);
                    return `
                    <div class="flex items-center gap-4 group cursor-pointer p-2 hover:bg-rose-50/50 rounded-2xl transition-colors" onclick="TeamController.openMember(${m.id})">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center border shadow-sm shrink-0 text-rose-500 bg-rose-100 border-rose-200 font-black text-[11px]">#${index + 1}</div>
                        <img src="${m.avatarSrc}" class="w-10 h-10 rounded-full object-cover border border-white shadow-sm shrink-0 grayscale group-hover:grayscale-0 transition-all">
                        <div class="w-32 md:w-40 shrink-0">
                            <h4 class="text-xs font-black text-slate-800 uppercase truncate group-hover:text-rose-600 transition-colors" title="${m.fullName}">${m.fullName}</h4>
                            <p class="text-[10px] font-bold text-slate-500 mt-0.5">Trễ <b class="text-rose-500">${m.totalLate}/${m.totalTasks}</b> việc</p>
                        </div>
                        <div class="flex-1 h-7 bg-slate-50 rounded-full overflow-hidden relative flex items-center border border-slate-100/50 shadow-inner">
                            <div class="h-full bg-rose-500 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2.5" style="width: 0%" data-chart-width="${relativeWidth}%">
                                <span class="text-[10px] font-[900] text-white drop-shadow-sm">${m.lateRate}%</span>
                            </div>
                        </div>
                    </div>`;
                }).join('');
            }

            let volHtml = '<div class="text-center text-slate-400 py-6 text-[11px] font-bold border-2 border-dashed border-slate-100 rounded-2xl">Chưa có dữ liệu</div>';
            if (topVolume.length > 0) {
                volHtml = topVolume.map((m, index) => {
                    let medalColor = index === 0 ? 'text-indigo-600 bg-indigo-100 border-indigo-300' : 'text-slate-500 bg-slate-100 border-slate-300';
                    let relativeWidth = Math.max(Math.round((m.totalTasks / maxTotalVolume) * 100), 8);
                    return `
                    <div class="flex items-center gap-4 group cursor-pointer p-2 hover:bg-indigo-50/50 rounded-2xl transition-colors" onclick="TeamController.openMember(${m.id})">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center border shadow-sm shrink-0 ${medalColor} font-black text-[11px]">#${index + 1}</div>
                        <img src="${m.avatarSrc}" class="w-10 h-10 rounded-full object-cover border border-white shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                        <div class="w-32 md:w-40 shrink-0">
                            <h4 class="text-xs font-black text-slate-800 uppercase truncate group-hover:text-indigo-600 transition-colors" title="${m.fullName}">${m.fullName}</h4>
                            <p class="text-[10px] font-bold text-slate-500 mt-0.5">Xong <b class="text-indigo-600">${m.doneTotal}</b> / Tổng ${m.totalTasks}</p>
                        </div>
                        <div class="flex-1 h-7 bg-slate-50 rounded-full overflow-hidden relative flex items-center border border-slate-100/50 shadow-inner">
                            <div class="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2.5" style="width: 0%" data-chart-width="${relativeWidth}%">
                                <span class="text-[10px] font-[900] text-white drop-shadow-sm">${m.totalTasks}</span>
                            </div>
                        </div>
                    </div>`;
                }).join('');
            }

            leaderboardHtml = `
            <div class="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-100 shadow-sm mb-8 animate-in slide-in-from-bottom-4">
                
                <div class="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4 mb-6">
                    <button onclick="TeamDeptDetailService.switchTab('good')" id="btn-tab-good" class="px-5 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 font-black text-xs uppercase tracking-widest shadow-sm border border-emerald-100 transition-all flex items-center gap-2">
                        <i data-lucide="award" width="16"></i> Top Đúng Hạn
                    </button>
                    <button onclick="TeamDeptDetailService.switchTab('bad')" id="btn-tab-bad" class="px-5 py-2.5 rounded-xl text-slate-400 hover:bg-slate-50 font-bold text-xs uppercase tracking-widest border border-transparent transition-all flex items-center gap-2">
                        <i data-lucide="siren" width="16"></i> Top Trễ Hạn
                    </button>
                    <button onclick="TeamDeptDetailService.switchTab('vol')" id="btn-tab-vol" class="px-5 py-2.5 rounded-xl text-slate-400 hover:bg-slate-50 font-bold text-xs uppercase tracking-widest border border-transparent transition-all flex items-center gap-2">
                        <i data-lucide="layers" width="16"></i> Top Công Việc
                    </button>
                </div>

                <div id="content-tab-good" class="space-y-1 block animate-in fade-in zoom-in-95 duration-300">${goodHtml}</div>
                <div id="content-tab-bad" class="space-y-1 hidden animate-in fade-in zoom-in-95 duration-300">${badHtml}</div>
                <div id="content-tab-vol" class="space-y-1 hidden animate-in fade-in zoom-in-95 duration-300">${volHtml}</div>

            </div>`;
        }

        // =========================================================
        // BƯỚC 4: RENDER DANH SÁCH THẺ NHÂN VIÊN
        // =========================================================
        const cardsHtml = processedMembers.map(m => {
            const { progressRate, lateRate, activeOverdue, doneTotal, activeTasks, totalTasks, avatarSrc, safeName } = m;
            const canRate = (TeamController.state.role !== 'STAFF') && (TeamController.state.myId != m.id);
            const currentRating = m.current_month_rating || m.latest_rating;

            let avatarHTML = `
                <div class="relative shrink-0">
                    <img src="${avatarSrc}" class="w-12 h-12 rounded-[16px] object-cover border border-slate-100 shadow-sm">
                    <div class="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" title="Đang hoạt động"></div>
                </div>
            `;

            let slaColor = '';
            let barColor = '';
            if (progressRate >= 80) { slaColor = 'text-emerald-500'; barColor = 'bg-emerald-500'; }
            else if (progressRate >= 50) { slaColor = 'text-amber-500'; barColor = 'bg-amber-400'; }
            else { slaColor = 'text-rose-500'; barColor = 'bg-rose-500'; }

            let perfBadge = '';
            if (totalTasks > 0) {
                if (progressRate >= 80 && lateRate <= 20) {
                    perfBadge = `<span class="inline-flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100"><i data-lucide="shield-check" width="12"></i> Xuất sắc</span>`;
                } else if (progressRate < 60 && lateRate >= 40) {
                    perfBadge = `<span class="inline-flex items-center gap-1 text-[9px] font-black text-rose-500 uppercase bg-rose-50 px-2 py-1 rounded-lg border border-rose-100"><i data-lucide="thumbs-down" width="12"></i> Tệ</span>`;
                }
            }

            let statusBadge = '';
            if (activeOverdue > 0) {
                statusBadge = `<span class="inline-flex items-center gap-1 text-[9px] font-black text-rose-500 uppercase animate-pulse bg-rose-50 px-2 py-1 rounded-lg border border-rose-100"><i data-lucide="alert-triangle" width="12"></i> ${activeOverdue} Đang trễ</span>`;
            } else if (activeTasks > 0) {
                statusBadge = `<span class="inline-flex items-center gap-1 text-[9px] font-black text-blue-500 uppercase bg-blue-50 px-2 py-1 rounded-lg"><i data-lucide="loader" width="12"></i> Đang làm</span>`;
            } else if (doneTotal > 0) {
                // ĐÃ FIX: Cho lên màu xanh ngọc bích y như ý em!
                statusBadge = `<span class="inline-flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100"><i data-lucide="check-circle-2" width="12"></i> Hoàn thành</span>`;
            } else {
                statusBadge = `<span class="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Đang rảnh</span>`;
            }

            let badgeHtml = `<div class="flex items-center gap-1.5">${perfBadge}${statusBadge}</div>`;

            let evaluationHtml = '';
            if (canRate) {
                if (currentRating) {
                    let btnClass = '', iconName = '';
                    if (currentRating === 'STAR') { btnClass = 'bg-yellow-50 text-yellow-500 border-yellow-200'; iconName = 'star'; }
                    else if (currentRating === 'LIKE') { btnClass = 'bg-blue-50 text-blue-500 border-blue-200'; iconName = 'thumbs-up'; }
                    else { btnClass = 'bg-rose-50 text-rose-500 border-rose-200'; iconName = 'thumbs-down'; }

                    evaluationHtml = `
                    <div class="flex items-center gap-2 z-20" onclick="event.stopPropagation()">
                        <div class="w-7 h-7 rounded-full flex items-center justify-center border shadow-sm ${btnClass}" title="Đã đánh giá tháng này"><i data-lucide="${iconName}" width="12"></i></div>
                        <button onclick="TeamController.openRatingModal(${m.id}, '${safeName}', '${currentRating}')" class="text-[9px] font-black text-indigo-400 hover:text-indigo-600 underline underline-offset-2 uppercase tracking-widest transition-colors">Sửa</button>
                    </div>`;
                } else {
                    evaluationHtml = `
                    <button onclick="TeamController.openRatingModal(${m.id}, '${safeName}', 'LIKE'); event.stopPropagation();" class="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors shadow-sm border border-slate-100 z-20 relative">Đánh giá</button>`;
                }
            }

            return `
            <div class="bg-white rounded-[32px] overflow-hidden p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col relative group cursor-pointer min-h-[220px]" onclick="TeamController.openMember(${m.id})">
                <div class="flex items-center justify-between mb-5 pointer-events-none">
                    <div class="flex items-start gap-3 w-full">
                        ${avatarHTML}
                        <div class="flex-1 min-w-0 pt-1">
                            <h4 class="font-[900] text-sm text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors break-words leading-snug line-clamp-2">${m.fullName}</h4>
                            <p class="text-[9px] font-bold text-slate-400 mt-1 break-words line-clamp-2">${m.email || 'Chưa có email'}</p>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-2 mb-5 pointer-events-none">
                    <div class="bg-slate-50 rounded-[16px] p-2 border border-slate-100/50 flex flex-col justify-center items-center text-center">
                        <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Đúng hạn</p>
                        <div class="text-lg font-[900] ${slaColor} tracking-tighter leading-none">${totalTasks > 0 ? progressRate + '<span class="text-[9px] opacity-50">%</span>' : '--'}</div>
                    </div>
                    <div class="bg-slate-50 rounded-[16px] p-2 border border-slate-100/50 flex flex-col justify-center items-center text-center">
                        <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Trễ hạn</p>
                        <div class="text-lg font-[900] text-rose-500 tracking-tighter leading-none">${totalTasks > 0 ? lateRate + '<span class="text-[9px] opacity-50">%</span>' : '--'}</div>
                    </div>
                    <div class="bg-slate-50 rounded-[16px] p-2 border border-slate-100/50 flex flex-col justify-center items-center text-center">
                        <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Đang chờ</p>
                        <div class="text-lg font-[900] text-slate-700 tracking-tighter leading-none">${activeTasks} <span class="text-[9px] font-bold text-slate-400 uppercase">việc</span></div>
                    </div>
                </div>

                <div class="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                    <div class="pointer-events-none">${badgeHtml}</div>
                    <div>${evaluationHtml}</div>
                </div>

                <div class="absolute bottom-0 left-0 w-full h-1 bg-slate-50 pointer-events-none">
                    <div class="h-full ${barColor} transition-all duration-1000" style="width: ${totalTasks > 0 ? progressRate : 0}%"></div>
                </div>
            </div>`;
        }).join('');

        container.innerHTML = leaderboardHtml + `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">${cardsHtml}</div>`;

        if (window.lucide) lucide.createIcons();
        setTimeout(() => {
            const chartBars = container.querySelectorAll('[data-chart-width]');
            chartBars.forEach(bar => { bar.style.width = bar.getAttribute('data-chart-width'); });
        }, 100);
    },

    switchTab: (tabId) => {
        const tabs = ['good', 'bad', 'vol'];
        tabs.forEach(t => {
            const btn = document.getElementById(`btn-tab-${t}`);
            const content = document.getElementById(`content-tab-${t}`);
            if (!btn || !content) return;

            if (t === tabId) {
                content.classList.remove('hidden');
                content.classList.add('block');

                if (t === 'good') btn.className = "px-5 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 font-black text-xs uppercase tracking-widest shadow-sm border border-emerald-100 transition-all flex items-center gap-2";
                if (t === 'bad') btn.className = "px-5 py-2.5 rounded-xl bg-rose-50 text-rose-600 font-black text-xs uppercase tracking-widest shadow-sm border border-rose-100 transition-all flex items-center gap-2";
                if (t === 'vol') btn.className = "px-5 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 font-black text-xs uppercase tracking-widest shadow-sm border border-indigo-100 transition-all flex items-center gap-2";
            } else {
                content.classList.remove('block');
                content.classList.add('hidden');

                btn.className = "px-5 py-2.5 rounded-xl text-slate-400 hover:bg-slate-50 font-bold text-xs uppercase tracking-widest border border-transparent transition-all flex items-center gap-2";
            }
        });

        setTimeout(() => {
            const activeContent = document.getElementById(`content-tab-${tabId}`);
            if (activeContent) {
                const chartBars = activeContent.querySelectorAll('[data-chart-width]');
                chartBars.forEach(bar => {
                    bar.style.width = "0%";
                    setTimeout(() => { bar.style.width = bar.getAttribute('data-chart-width'); }, 50);
                });
            }
        }, 50);
    }
};