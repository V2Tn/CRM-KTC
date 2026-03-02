window.TeamMemberDetailService = {
    render: () => {
        const container = document.getElementById('view-member-detail');
        const user = TeamController.state.currentMemberInfo;
        const allTasks = TeamController.state.currentMemberTasks;
        const currentFilter = TeamController.state.activeStatusFilter;

        const countLate = allTasks.filter(t => {
            if (t.status == 3) return t.isOverdue == 1;
            if (t.status == 4) return false;
            return t.isOverdue == 1 || (t.endTime && new Date(t.endTime) < new Date());
        }).length;

        const doneOnTime = allTasks.filter(t => t.status == 3 && t.isOverdue != 1).length;

        const counts = {
            all: allTasks.length,
            1: allTasks.filter(t => t.status == 1).length,
            2: allTasks.filter(t => t.status == 2).length,
            3: allTasks.filter(t => t.status == 3).length,
            4: allTasks.filter(t => t.status == 4).length,
            late: countLate
        };

        let progressRate = counts.all > 0 ? Math.round((doneOnTime / counts.all) * 100) : 0;
        progressRate = Math.min(progressRate, 100);

        let filteredTasks = allTasks;
        if (currentFilter === 'late') {
            filteredTasks = allTasks.filter(t => {
                if (t.status == 3) return t.isOverdue == 1;
                if (t.status == 4) return false;
                return t.isOverdue == 1 || (t.endTime && new Date(t.endTime) < new Date());
            });
        } else if (currentFilter !== 'all') {
            filteredTasks = filteredTasks.filter(t => parseInt(t.status) === parseInt(currentFilter));
        }

        const itemsPerPage = TeamController.state.itemsPerPage;
        const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

        if (TeamController.state.currentPage > totalPages) TeamController.state.currentPage = 1;
        if (TeamController.state.currentPage < 1) TeamController.state.currentPage = 1;

        const startIdx = (TeamController.state.currentPage - 1) * itemsPerPage;
        const endIdx = startIdx + itemsPerPage;
        const paginatedTasks = filteredTasks.slice(startIdx, endIdx);

        const fmt = (d) => {
            if (!d) return '--/--';
            const date = new Date(d);
            return isNaN(date.getTime()) ? '--/--' : date.toLocaleDateString('vi-VN', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
            });
        };

        const avatarSrc = user.avatar
            ? user.avatar
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random&size=128`;

        let html = `
        <div class="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm mb-6 animate-in slide-in-from-top-4">
            <div class="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                
                <div class="flex items-center gap-5 min-w-0 w-full xl:w-auto">
                    <div class="relative group cursor-pointer shrink-0" onclick="TeamController.openRatingModal(${user.id}, '${user.fullName.replace(/'/g, "\\'")}')">
                        <img src="${avatarSrc}" class="w-16 h-16 rounded-[20px] object-cover shadow-md border-2 border-white group-hover:scale-105 transition-transform duration-300">
                        <div class="absolute inset-0 bg-black/40 rounded-[20px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]">
                            <i data-lucide="star" width="20" class="text-yellow-400 drop-shadow-md fill-yellow-400"></i>
                        </div>
                    </div>

                    <div class="min-w-0">
                        <div class="flex items-center gap-3 mb-2">
                            <h3 class="font-[900] text-slate-800 uppercase text-xl tracking-tight leading-none truncate">${user.fullName}</h3>
                            ${user.email ? `<span class="text-[9px] text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-lg tracking-widest uppercase hidden md:inline-block truncate">${user.email}</span>` : ''}
                        </div>
                        <div class="flex flex-wrap items-center gap-3">
                            <div class="w-24 sm:w-32 shrink-0 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div class="h-full bg-emerald-500 rounded-full transition-all duration-1000" style="width: ${progressRate}%"></div>
                            </div>
                            <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Đúng hạn: <span class="text-emerald-600">${progressRate}%</span></span>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-2 bg-slate-50 p-1.5 rounded-[20px] border border-slate-100 w-full xl:w-auto overflow-x-auto shrink-0 scrollbar-hide">
                    ${TeamMemberDetailService._renderFilterBtn('all', `Tất cả (${counts.all})`, currentFilter)}
                    ${TeamMemberDetailService._renderFilterBtn(2, `Đang làm (${counts[2]})`, currentFilter)}
                    ${TeamMemberDetailService._renderFilterBtn(3, `Đã xong (${counts[3]})`, currentFilter)}
                    ${TeamMemberDetailService._renderFilterBtn('late', `Trễ hạn (${counts.late})`, currentFilter)}
                    ${TeamMemberDetailService._renderFilterBtn(4, `Đã huỷ (${counts[4]})`, currentFilter)}
                </div>

            </div>
        </div>`;

        html += `<div class="grid grid-cols-1 gap-5 min-h-[300px] content-start">`;
        if (paginatedTasks.length === 0) {
            html += '<div class="py-24 text-center border-2 border-dashed border-slate-200 bg-slate-50 rounded-[32px] text-slate-400 uppercase text-[11px] font-black tracking-widest flex flex-col items-center justify-center gap-3"><i data-lucide="inbox" width="32" class="opacity-50"></i> Không có dữ liệu công việc</div>';
        } else {
            html += paginatedTasks.map(t => {
                const statusMap = {
                    1: { text: 'MỚI', class: 'bg-blue-50 text-blue-600 border-blue-100', icon: 'sparkles', iconColor: 'text-blue-500' },
                    2: { text: 'ĐANG LÀM', class: 'bg-amber-50 text-amber-600 border-amber-100', icon: 'loader', iconColor: 'text-amber-500 animate-spin-slow' },
                    3: { text: 'HOÀN THÀNH', class: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: 'check-circle-2', iconColor: 'text-emerald-500' },
                    4: { text: 'ĐÃ HỦY', class: 'bg-slate-50 text-slate-500 border-slate-200', icon: 'x-circle', iconColor: 'text-slate-400' }
                };
                const st = statusMap[t.status] || statusMap[1];

                let isLate = false;
                let lateText = '';

                if (t.status == 3) {
                    if (t.isOverdue == 1) {
                        isLate = true;
                        lateText = 'Hoàn thành trễ';
                    }
                } else if (t.status != 4) {
                    if (t.isOverdue == 1 || (t.endTime && new Date(t.endTime) < new Date())) {
                        isLate = true;
                        lateText = 'Đang trễ hạn';
                    }
                }

                const lateBadge = isLate ? `<span class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-100 flex items-center gap-1 shadow-sm"><i data-lucide="alert-triangle" width="10"></i> ${lateText}</span>` : '';

                let processingHtml = '';
                if (t.status == 3) {
                    const startStr = t.startTime || t.createdAt;
                    const endStr = t.updatedAt || t.createdAt;
                    if (startStr && endStr) {
                        const startD = new Date(startStr);
                        const endD = new Date(endStr);
                        if (!isNaN(startD) && !isNaN(endD)) {
                            const diffMs = endD - startD;
                            if (diffMs > 0) {
                                const diffMins = Math.floor(diffMs / 60000);
                                const days = Math.floor(diffMins / 1440);
                                const hours = Math.floor((diffMins % 1440) / 60);
                                const mins = diffMins % 60;

                                let parts = [];
                                if (days > 0) parts.push(`${days} ngày`);
                                if (hours > 0) parts.push(`${hours} giờ`);
                                if (mins > 0 || parts.length === 0) parts.push(`${mins} phút`);

                                processingHtml = `
                                <div class="flex items-center justify-between text-[10px] font-bold bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 mt-1 animate-in zoom-in duration-300">
                                    <span class="flex items-center gap-1.5 text-indigo-600"><i data-lucide="timer" width="14"></i> Thời gian xử lý</span>
                                    <span class="text-indigo-700 font-black">${parts.join(' ')}</span>
                                </div>`;
                            }
                        }
                    }
                }

                return `
                <div class="bg-white p-5 md:p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all group animate-in slide-in-from-bottom-2 flex flex-col md:flex-row gap-5">
                    
                    <div class="flex-1 flex items-start gap-4 min-w-0">
                        <div class="w-12 h-12 rounded-2xl ${st.class} flex items-center justify-center shrink-0 border shadow-inner transition-transform group-hover:scale-105">
                            <i data-lucide="${st.icon}" width="22" class="${st.iconColor}"></i>
                        </div>
                        <div class="flex-1 min-w-0 pt-0.5">
                            <div class="flex flex-wrap items-center gap-2 mb-2">
                                <span class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap border ${st.class}">${st.text}</span>
                                ${lateBadge}
                            </div>
                            <h5 class="font-[900] text-slate-800 text-base mb-3 uppercase tracking-tight leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors cursor-pointer">${t.title}</h5>
                            
                            <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-bold text-slate-400">
                                <span class="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100"><i data-lucide="user-circle" width="12" class="text-slate-400"></i> Giao bởi: <span class="text-indigo-500">${t.createdByLabel || 'System'}</span></span>
                                <span class="flex items-center gap-1.5"><i data-lucide="clock-3" width="12"></i> Tạo lúc: ${fmt(t.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="shrink-0 w-full md:w-[260px] flex flex-col gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5 justify-center">
                        <div class="flex items-center justify-between text-[10px] font-bold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span class="flex items-center gap-1.5 text-slate-500"><i data-lucide="play-circle" width="14" class="text-indigo-400"></i> Bắt đầu</span>
                            <span class="text-slate-700 font-black">${fmt(t.startTime)}</span>
                        </div>
                        <div class="flex items-center justify-between text-[10px] font-bold ${isLate ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-slate-50 border-slate-100 text-slate-500'} p-2.5 rounded-xl border">
                            <span class="flex items-center gap-1.5"><i data-lucide="stop-circle" width="14" class="${isLate ? 'text-rose-500' : 'text-slate-400'}"></i> Hạn chót</span>
                            <span class="${isLate ? 'text-rose-600' : 'text-slate-700'} font-black">${fmt(t.endTime)}</span>
                        </div>
                        ${t.status == 3 ? `
                        <div class="flex items-center justify-between text-[10px] font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 mt-1 animate-in zoom-in duration-300">
                            <span class="flex items-center gap-1.5 text-emerald-600"><i data-lucide="check-check" width="14"></i> Hoàn thành lúc</span>
                            <span class="text-emerald-700 font-black">${fmt(t.updatedAt)}</span>
                        </div>` : ''}
                        
                        ${processingHtml}
                    </div>
                    
                </div>`;
            }).join('');
        }
        html += `</div>`;

        if (totalPages > 1) {
            html += `
            <div class="flex justify-center items-center gap-3 mt-8 pt-6 border-t border-slate-100">
                <button onclick="TeamController.changePage(${TeamController.state.currentPage - 1})" 
                        class="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
                        ${TeamController.state.currentPage === 1 ? 'disabled' : ''}>
                    <i data-lucide="chevron-left" width="20"></i>
                </button>
                
                <div class="px-5 py-2.5 bg-slate-800 text-white rounded-xl shadow-md flex items-center gap-2 text-[10px] font-black tracking-widest">
                    <span>TRANG</span>
                    <span class="bg-slate-700 px-2 py-0.5 rounded-md">${TeamController.state.currentPage}</span>
                    <span class="text-slate-400">/</span>
                    <span class="text-slate-400">${totalPages}</span>
                </div>

                <button onclick="TeamController.changePage(${TeamController.state.currentPage + 1})" 
                        class="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
                        ${TeamController.state.currentPage === totalPages ? 'disabled' : ''}>
                    <i data-lucide="chevron-right" width="20"></i>
                </button>
            </div>`;
        }

        container.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    },

    _renderFilterBtn: (v, l, a) => `<button onclick="TeamController.filterMemberTasks('${v}')" class="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${v == a ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-400 hover:bg-slate-50"}">${l}</button>`
};