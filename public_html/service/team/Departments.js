window.TeamDeptService = {
    renderTotalStats: (s) => {
        const container = document.getElementById('view-total-stats');
        if (!container) return;

        container.classList.remove('hidden');
        container.className = "flex justify-center mb-10 animate-in zoom-in duration-300";

        const total = s.done + s.doing + s.new + s.overdue + s.cancel;

        if (total === 0 && s.staff === 0) {
            container.innerHTML = `<div class="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 text-center text-slate-400 text-xs font-black uppercase tracking-widest w-full">Chưa có dữ liệu</div>`;
            return;
        }

        const vDone = total > 0 ? (s.done / total) * 100 : 0;
        const vDoing = total > 0 ? (s.doing / total) * 100 : 0;
        const vNew = total > 0 ? (s.new / total) * 100 : 0;
        const vOverdue = total > 0 ? (s.overdue / total) * 100 : 0;
        const vCancel = total > 0 ? (s.cancel / total) * 100 : 0;

        let offset = 0;
        const createCircle = (val, color, title) => {
            if (val === 0) return '';
            const circle = `<circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="${color}" stroke-width="4" stroke-dasharray="${val} ${100 - val}" stroke-dashoffset="${offset}" class="hover:opacity-75 transition-opacity cursor-pointer"><title>${title}</title></circle>`;
            offset -= val;
            return circle;
        };

        const cDone = '#10b981';
        const cDoing = '#a855f7';
        const cNew = '#3b82f6';
        const cOverdue = '#f43f5e';
        const cCancel = '#0f172a';

        const svgCircles = `
            ${createCircle(vDone, cDone, `Hoàn thành: ${s.done} việc`)}
            ${createCircle(vDoing, cDoing, `Đang xử lý: ${s.doing} việc`)}
            ${createCircle(vNew, cNew, `Mới: ${s.new} việc`)}
            ${createCircle(vOverdue, cOverdue, `Trễ hạn: ${s.overdue} việc`)}
            ${createCircle(vCancel, cCancel, `Đã hủy: ${s.cancel} việc`)}
        `;

        container.innerHTML = `
        <div class="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 w-full max-w-6xl mx-auto">
            <div class="flex flex-col items-center justify-center shrink-0 w-24">
                <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-2 shadow-sm border border-indigo-100">
                    <i data-lucide="users" width="24"></i>
                </div>
                <span class="text-3xl font-[900] text-slate-800 tracking-tighter">${s.staff}</span>
                <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 text-center">Nhân sự</span>
            </div>
            <div class="hidden md:block w-px h-20 bg-slate-100"></div>
            <div class="relative w-32 h-32 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 42 42" class="w-full h-full transform -rotate-90 drop-shadow-sm">
                    <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="#f1f5f9" stroke-width="4"></circle>
                    ${svgCircles}
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span class="text-2xl font-[900] text-slate-800 tracking-tighter leading-none mt-1">${total}</span>
                    <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Tổng việc</span>
                </div>
            </div>
            <div class="hidden md:block w-px h-20 bg-slate-100"></div>
            <div class="flex-1 w-full grid grid-cols-2 lg:grid-cols-5 gap-3">
                <div class="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div class="flex items-center gap-1.5 mb-1"><div class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></div><span class="text-[9px] font-black uppercase tracking-widest text-slate-500">Hoàn thành</span></div>
                    <div class="text-xl font-[900] text-slate-800">${s.done}</div>
                </div>
                <div class="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div class="flex items-center gap-1.5 mb-1"><div class="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm"></div><span class="text-[9px] font-black uppercase tracking-widest text-slate-500">Đang xử lý</span></div>
                    <div class="text-xl font-[900] text-slate-800">${s.doing}</div>
                </div>
                <div class="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div class="flex items-center gap-1.5 mb-1"><div class="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></div><span class="text-[9px] font-black uppercase tracking-widest text-slate-500">Mới</span></div>
                    <div class="text-xl font-[900] text-slate-800">${s.new}</div>
                </div>
                <div class="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-rose-50 border border-rose-100 shadow-sm">
                    <div class="flex items-center gap-1.5 mb-1"><div class="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm animate-pulse"></div><span class="text-[9px] font-black uppercase tracking-widest text-rose-600">Trễ hạn</span></div>
                    <div class="text-xl font-[900] text-rose-600">${s.overdue}</div>
                </div>
                <div class="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div class="flex items-center gap-1.5 mb-1"><div class="w-2.5 h-2.5 rounded-full bg-slate-900 shadow-sm"></div><span class="text-[9px] font-black uppercase tracking-widest text-slate-500">Đã Hủy</span></div>
                    <div class="text-xl font-[900] text-slate-800">${s.cancel}</div>
                </div>
            </div>
        </div>`;

        if (window.lucide) lucide.createIcons();
    },

    renderDepartmentsList: (departments) => {
        const container = document.getElementById('view-departments');
        if (!container) return;

        container.classList.remove('hidden');
        document.getElementById('view-dept-detail')?.classList.add('hidden');
        document.getElementById('view-member-detail')?.classList.add('hidden');
        document.getElementById('btn-team-back')?.classList.add('hidden');

        if (departments.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center py-20 text-slate-400">Chưa có dữ liệu phòng ban</div>';
            return;
        }

        container.innerHTML = departments.map(d => {
            const doneTotal = parseInt(d.stats.done) || 0;
            const doneOnTime = parseInt(d.stats.done_on_time) || 0;
            const activeOverdue = parseInt(d.stats.overdue) || 0;
            const activeTasks = (parseInt(d.stats.new) || 0) + (parseInt(d.stats.doing) || 0);
            const cancelTasks = parseInt(d.stats.cancel) || 0;

            const totalTasks = doneTotal + activeTasks + cancelTasks;

            let progressRate = totalTasks > 0 ? Math.round((doneOnTime / totalTasks) * 100) : 0;
            progressRate = Math.min(progressRate, 100);

            let slaColor = '';
            let barColor = '';
            if (progressRate >= 80) {
                slaColor = 'text-emerald-500'; barColor = 'bg-emerald-500';
            } else if (progressRate >= 50) {
                slaColor = 'text-amber-500'; barColor = 'bg-amber-400';
            } else {
                slaColor = 'text-rose-500'; barColor = 'bg-rose-500';
            }

            let badgeHtml = '';
            if (activeOverdue > 0) {
                badgeHtml = `<span class="inline-flex items-center gap-1 text-[9px] font-black text-rose-500 uppercase animate-pulse bg-rose-50 px-2 py-1 rounded-lg border border-rose-100"><i data-lucide="alert-triangle" width="12"></i> ${activeOverdue} Đang trễ</span>`;
            } else if (doneTotal > 0) {
                badgeHtml = `<span class="inline-flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase bg-emerald-50 px-2 py-1 rounded-lg"><i data-lucide="shield-check" width="12"></i> Xuất sắc</span>`;
            } else {
                badgeHtml = `<span class="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Đang rảnh</span>`;
            }

            let avatarHtml = '';
            const maxAvatars = 4;
            const displayMembers = d.members.slice(0, maxAvatars);

            displayMembers.forEach(m => {
                const avaSrc = m.avatar ? m.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(m.fullName)}&background=random&size=100`;
                avatarHtml += `<img src="${avaSrc}" title="${m.fullName}" class="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm hover:z-10 hover:scale-110 transition-transform cursor-pointer relative">`;
            });

            if (d.members.length > maxAvatars) {
                avatarHtml += `<div class="w-10 h-10 rounded-full border-2 border-white bg-slate-50 text-slate-500 flex items-center justify-center text-[10px] font-black shadow-sm relative z-0">+${d.members.length - maxAvatars}</div>`;
            }
            if (d.members.length === 0) {
                avatarHtml = `<span class="text-[10px] font-bold text-slate-300">Chưa có nhân sự</span>`;
            }

            return `
            <div onclick="TeamController.openDepartment(${d.id})" class="bg-white rounded-[32px] overflow-hidden p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 hover:-translate-y-1 transition-all duration-300 relative flex flex-col justify-between group cursor-pointer min-h-[220px]">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="font-[900] text-lg text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors truncate pr-2">${d.name}</h3>
                    <div class="shrink-0">${badgeHtml}</div>
                </div>
                <div class="mb-4">
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Nhân sự (${d.members.length})</p>
                    <div class="flex -space-x-3">${avatarHtml}</div>
                </div>
                <div class="flex justify-between items-end mt-auto pt-4 border-t border-slate-50">
                    <div>
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Đúng hạn</p>
                        <div class="text-4xl font-[900] ${slaColor} tracking-tighter">${totalTasks > 0 ? progressRate + '<span class="text-xl opacity-50">%</span>' : '--'}</div>
                    </div>
                    <div class="text-right">
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Đang chờ</p>
                        <div class="text-2xl font-[900] text-slate-700 tracking-tighter">${activeTasks} <span class="text-[10px] font-bold text-slate-400 uppercase">Việc</span></div>
                    </div>
                </div>
                <div class="absolute bottom-0 left-0 w-full h-1 bg-slate-50">
                    <div class="h-full ${barColor} transition-all duration-1000" style="width: ${totalTasks > 0 ? progressRate : 0}%"></div>
                </div>
            </div>`;
        }).join('');
        if (window.lucide) lucide.createIcons();
    },

    renderDepartmentChart: (departments) => {
        const wrapper = document.getElementById('view-department-chart');

        // ĐÃ FIX: Chỉ kiểm tra wrapper lúc này thôi
        if (!wrapper) return;

        if (departments.length < 2) {
            wrapper.classList.add('hidden');
            return;
        }

        wrapper.classList.remove('hidden');

        // Bơm HTML vào trước
        wrapper.innerHTML = `
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h3 class="text-xl font-black text-slate-800 uppercase tracking-tight">Bảng Hiệu Suất</h3>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Đánh giá dựa trên tỷ lệ giao việc ĐÚNG HẠN</p>
                </div>
                <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><i data-lucide="shield-check" width="24"></i></div>
            </div>
            <div id="dept-chart-container" class="space-y-6"></div>
        `;

        const sortedDepts = [...departments].map(d => {
            const doneTotal = parseInt(d.stats.done) || 0;
            const doneOnTime = parseInt(d.stats.done_on_time) || 0;
            const activeOverdue = parseInt(d.stats.overdue) || 0;
            const activeTasks = (parseInt(d.stats.new) || 0) + (parseInt(d.stats.doing) || 0);
            const cancelTasks = parseInt(d.stats.cancel) || 0;

            const totalTasks = doneTotal + activeTasks + cancelTasks;

            let progressRate = totalTasks > 0 ? Math.round((doneOnTime / totalTasks) * 100) : 0;
            progressRate = Math.min(progressRate, 100);

            return { ...d, progressRate, doneTotal, totalTasks, activeOverdue };
        }).sort((a, b) => {
            if (b.progressRate !== a.progressRate) return b.progressRate - a.progressRate;
            return b.doneTotal - a.doneTotal;
        });

        // ĐÃ FIX: Lúc này HTML đã được bơm ra, nên lấy ID mới ra kết quả!
        const newContainer = document.getElementById('dept-chart-container');
        if (!newContainer) return;

        newContainer.innerHTML = sortedDepts.map((d, index) => {
            let barColor = '';
            if (d.totalTasks === 0) barColor = 'bg-transparent';
            else if (d.progressRate >= 80) barColor = 'bg-emerald-500 shadow-sm';
            else if (d.progressRate >= 50) barColor = 'bg-amber-400 shadow-sm';
            else barColor = 'bg-rose-500 shadow-md shadow-rose-200';

            let badgeHtml = '';
            if (d.activeOverdue > 0) {
                badgeHtml = `<span class="inline-flex items-center gap-1 text-[9px] font-black text-rose-500 uppercase animate-pulse bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 w-fit"><i data-lucide="alert-triangle" width="12"></i> ${d.activeOverdue} Đang trễ</span>`;
            } else if (d.doneTotal > 0) {
                badgeHtml = `<span class="inline-flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase bg-emerald-50 px-2 py-1 rounded-lg w-fit"><i data-lucide="check" width="12"></i> Xuất sắc</span>`;
            } else {
                badgeHtml = `<span class="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Chưa có data</span>`;
            }

            return `
            <div class="flex items-center gap-5 group cursor-pointer" onclick="TeamController.openDepartment(${d.id})">
                <div class="w-24 md:w-32 shrink-0 text-right">
                    <h4 class="text-xs font-black text-slate-800 uppercase truncate group-hover:text-indigo-600 transition-colors" title="${d.name}">${d.name}</h4>
                    <p class="text-[9px] font-bold text-slate-400 mt-0.5">Xong ${d.doneTotal} việc</p>
                </div>
                <div class="flex-1 h-10 bg-slate-50 rounded-2xl overflow-hidden relative flex items-center border border-slate-100 shadow-inner">
                    <div class="h-full ${barColor} rounded-2xl transition-all duration-1000 ease-out flex items-center justify-end ${d.progressRate > 0 && d.totalTasks > 0 ? 'pr-3' : ''}" style="width: 0%" data-target-width="${d.totalTasks > 0 ? d.progressRate : 0}%">
                        ${d.progressRate > 8 && d.totalTasks > 0 ? `<span class="text-[11px] font-[900] text-white drop-shadow-sm">${d.progressRate}%</span>` : ''}
                    </div>
                </div>
                <div class="w-24 shrink-0 text-left flex flex-col justify-center">
                     ${badgeHtml}
                </div>
            </div>`;
        }).join('');

        if (window.lucide) lucide.createIcons();
        setTimeout(() => {
            const bars = newContainer.querySelectorAll('[data-target-width]');
            bars.forEach(bar => { bar.style.width = bar.getAttribute('data-target-width'); });
        }, 100);
    }
};