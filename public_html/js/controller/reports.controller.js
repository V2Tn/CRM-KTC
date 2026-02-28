/**
 * js/reports.controller.js
 * Hoàn chỉnh: View-only, Dual Banner (Cá nhân & Giao việc), Fix hiển thị tên, CHỐNG LỖI CHO ROLE STAFF
 */
const ReportController = {
    allData: { myTasks: [], assignedTasks: [] },
    currentPeriod: 'today',
    currentView: 'my', // 'my' hoặc 'assign'

    init: function () {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('view') === 'assign') {
            this.currentView = 'assign';
        }

        this.loadReport(this.currentPeriod);
    },

    async loadReport(period) {
        this.currentPeriod = period;

        document.querySelectorAll('.period-btn').forEach(btn => {
            const isActive = btn.getAttribute('onclick').includes(period);
            btn.className = `period-btn px-5 py-2 text-sm font-black rounded-xl transition-all ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`;
        });

        const urlParams = new URLSearchParams(window.location.search);
        const focusTaskId = urlParams.get('focus_task');

        const payload = { action: 'fetch_report_data', period: period };
        if (focusTaskId) payload.filter = 'all';

        try {
            const res = await Utils.callApi('fetch_report_data', payload);

            if (res.status === 'success') {
                this.allData.myTasks = this.normalize(res.myTasks);
                this.allData.assignedTasks = this.normalize(res.assignedTasks);

                // [THÊM MỚI] Lưu thêm dữ liệu 2 loại biểu đồ vào Cache JS
                this.allData.myChartData = res.myChartData || [];
                this.allData.assignChartData = res.assignChartData || [];

                const setValSafe = (id, val) => {
                    const el = document.getElementById(id);
                    if (el) el.innerText = val;
                };

                setValSafe('my-done-count', res.myStats.done);
                setValSafe('my-total-count', res.myStats.total);
                setValSafe('assign-done-count', res.assignStats.done);
                setValSafe('assign-total-count', res.assignStats.total);

                // Gọi switchDiary để nó tự lo việc Render cả Danh sách + Biểu đồ
                this.switchDiary(this.currentView);

                if (focusTaskId) this.focusTaskFromUrl();
            }
        } catch (error) {
            console.error("Lỗi tải báo cáo:", error);
        }
    },

    switchDiary(type) {
        this.currentView = type;
        const btnMy = document.getElementById('btn-diary-my');
        const btnAssign = document.getElementById('btn-diary-assign');

        if (btnMy) btnMy.className = `px-4 py-2 text-[10px] font-black rounded-lg ${type === 'my' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`;
        if (btnAssign) btnAssign.className = `px-4 py-2 text-[10px] font-black rounded-lg ${type === 'assign' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`;

        // 1. Render lại danh sách Task dưới cùng
        this.renderDiary(type === 'my' ? this.allData.myTasks : this.allData.assignedTasks);

        // 2. [THÊM MỚI] Render lại Biểu đồ dựa trên tab đang chọn!
        this.renderChart(type === 'my' ? this.allData.myChartData : this.allData.assignChartData);

        // 3. [UX xịn] Đổi luôn phụ đề biểu đồ cho người dùng dễ phân biệt
        const subLabel = document.getElementById('period-sub-label');
        if (subLabel) {
            subLabel.innerText = type === 'my' ? 'DỮ LIỆU CÔNG VIỆC TÔI LÀM' : 'DỮ LIỆU CÔNG VIỆC TÔI GIAO';
        }
    },

    normalize(tasks) {
        return tasks.map(t => ({
            ...t,
            status: Number(t.status),
            createdAt: t.createdAt || t.created_at,
            endTime: t.endTime || t.end_time,
            startTime: t.startTime || t.start_time,
            createdById: t.createdById || t.created_by_id,
            assigneeId: t.assigneeId || t.assignee_id,
            createdByLabel: t.createdByLabel || t.created_by_name || 'System',
            assigneeLabel: t.assigneeLabel || t.assignee_name || 'NV'
        }));
    },

    createReportTaskCard(task) {
        const statusId = parseInt(task.status);
        const isDone = statusId === 3;
        const isCancel = statusId === 4;

        let bgClass = 'bg-white';
        let borderLeft = 'border-l-4 border-slate-200';
        let statusBadge = '';
        let iconHtml = '';

        if (isDone) {
            bgClass = 'bg-[#f0fdf4] hover:bg-[#dcfce7]';
            borderLeft = 'border-l-4 border-emerald-500';
            statusBadge = '<span class="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-600">Hoàn thành</span>';
            iconHtml = '<div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><i data-lucide="check-check" width="16"></i></div>';
        } else if (isCancel) {
            bgClass = 'bg-slate-50 hover:bg-slate-100 opacity-70';
            borderLeft = 'border-l-4 border-slate-400';
            statusBadge = '<span class="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-200 text-slate-500">Đã hủy</span>';
            iconHtml = '<div class="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shrink-0"><i data-lucide="x" width="16"></i></div>';
        } else {
            bgClass = 'bg-white hover:bg-indigo-50/50';
            borderLeft = 'border-l-4 border-indigo-400';
            statusBadge = '<span class="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-100 text-indigo-600">Chưa xong</span>';
            iconHtml = '<div class="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0"><i data-lucide="clock" width="16"></i></div>';
        }

        const fmtTime = (d) => {
            if (!d) return '--:--';
            const date = new Date(d);
            return isNaN(date.getTime()) ? '' : date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        };

        const calcDuration = (start, end) => {
            if (!start || !end) return '';
            const startDate = new Date(start);
            const endDate = new Date(end);
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '';

            let diffMs = endDate - startDate;
            if (diffMs < 0) diffMs = 0;

            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

            let parts = [];
            if (diffDays > 0) parts.push(`${diffDays} ngày`);
            if (diffHours > 0) parts.push(`${diffHours} tiếng`);
            if (diffMinutes > 0 || parts.length === 0) parts.push(`${diffMinutes} phút`);

            return parts.join(' ');
        };

        let completedAtHtml = '';
        if (isDone) {
            const durationStr = calcDuration(task.startTime || task.createdAt, task.updatedAt);
            completedAtHtml = `
            <div class="inline-flex flex-wrap items-center gap-2.5 bg-white/80 px-3 py-2 rounded-xl border border-emerald-100 shadow-sm">
                <div class="flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold">
                    <i data-lucide="flag" width="12"></i> <span>Hoàn thành: ${fmtTime(task.updatedAt)}</span>
                </div>
                ${durationStr ? `
                <div class="w-1 h-1 rounded-full bg-emerald-300"></div>
                <div class="text-[9px] text-emerald-600 font-black uppercase tracking-wider bg-emerald-100/50 px-2 py-0.5 rounded-md">
                    Trong ${durationStr}
                </div>` : ''}
            </div>`;
        }

        return `
        <div id="task-card-${task.id}" class="${bgClass} ${borderLeft} rounded-r-2xl p-4 transition-all duration-300 border border-transparent shadow-sm flex flex-col xl:flex-row xl:items-center gap-4 group">
            
            <div class="flex items-start gap-4 flex-1 min-w-0">
                ${iconHtml}
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1.5">
                        <h4 class="text-sm font-black text-slate-800 uppercase truncate ${isDone || isCancel ? 'line-through opacity-80' : ''}">${task.title}</h4>
                        ${statusBadge}
                        ${task.isOverdue == 1 ? '<span class="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-rose-500 text-white animate-pulse shadow-sm">Trễ hạn</span>' : ''}
                    </div>
                    
                    <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-bold text-slate-400">
                        <div class="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                            <span class="text-slate-500"><i data-lucide="user" width="10" class="inline"></i> ${task.createdByLabel}</span>
                            <i data-lucide="arrow-right" width="10" class="text-slate-300"></i>
                            <span class="text-indigo-600 font-black">${task.assigneeLabel}</span>
                        </div>
                        
                        <div class="flex items-center gap-1 text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded-md">
                            <i data-lucide="play-circle" width="12"></i> <span>Bắt đầu: ${fmtTime(task.startTime || task.createdAt)}</span>
                        </div>
                        
                        <div class="flex items-center gap-1 text-rose-500 bg-rose-50/50 px-2 py-0.5 rounded-md">
                            <i data-lucide="calendar-off" width="12"></i> <span>Hạn chót: ${fmtTime(task.endTime)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="xl:text-right shrink-0 ml-12 xl:ml-0 mt-2 xl:mt-0 pt-2 xl:pt-0 border-t xl:border-0 border-slate-100">
                ${completedAtHtml}
                ${!isDone && !isCancel ? `<div class="text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 inline-block text-[10px] font-bold"><i data-lucide="activity" width="12" class="inline"></i> Đang xử lý...</div>` : ''}
            </div>

        </div>`;
    },

    renderChart(data) {
        const container = document.getElementById('chart-bars-container');
        if (!container) return;
        const maxVal = Math.max(...data.map(d => d.total), 5);
        container.innerHTML = data.map(d => {
            const doneH = (d.done / maxVal) * 100;
            const totalH = (d.total / maxVal) * 100;
            const perf = d.total > 0 ? Math.round((d.done / d.total) * 100) : 0;
            return `
                <div class="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer" 
                     onmouseenter="ReportController.showTooltip(event, '${d.fullLabel}', ${d.total}, ${d.done}, ${perf})"
                     onmouseleave="ReportController.hideTooltip()">
                    <div class="w-full flex items-end justify-center gap-1.5 h-48 transition-all">
                        <div class="w-1.5 md:w-5 bg-indigo-500 rounded-t-lg shadow-sm z-10" style="height: ${Math.max(doneH, 4)}%"></div>
                        <div class="w-1.5 md:w-5 bg-slate-100 rounded-t-lg" style="height: ${Math.max(totalH, 4)}%"></div>
                    </div>
                    <span class="text-[9px] font-black mt-3 text-slate-400 uppercase tracking-tighter">${d.label}</span>
                </div>`;
        }).join('');
    },

    renderDiary(tasks) {
        const container = document.getElementById('diary-container');
        if (!container) return;
        if (tasks.length === 0) {
            container.innerHTML = `<div class="py-20 text-center opacity-20 font-black uppercase tracking-widest text-xs">Không có dữ liệu ghi nhận</div>`;
            return;
        }
        const groups = {};
        tasks.forEach(t => {
            const dateStr = new Date(t.startTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            if (!groups[dateStr]) groups[dateStr] = { tasks: [], done: 0 };
            groups[dateStr].tasks.push(t);
            if (t.status == 3) groups[dateStr].done++;
        });
        container.innerHTML = Object.entries(groups).map(([date, g]) => {
            const accId = `acc-${date.replace(/\//g, '-')}`; // Fix lỗi Regex thay thế "/" thành "-"
            return `
            <div class="bg-white border border-slate-50 rounded-[32px] overflow-hidden shadow-sm mb-4">
                <button onclick="ReportController.toggleAccordion('${accId}')" class="w-full px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-all">
                    <div class="flex items-center gap-5">
                        <div id="icon-${accId}" class="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 transition-all duration-300 text-slate-300"><i data-lucide="chevron-right" width="18" stroke-width="4"></i></div>
                        <span class="text-sm font-[1000] text-slate-700 uppercase">Ngày ${date}</span>
                    </div>
                    <div class="px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] font-black text-indigo-600 uppercase">
                        ${g.done} / ${g.tasks.length} XONG
                    </div>
                </button>
                <div id="${accId}" class="hidden px-8 pb-10 space-y-4 pt-4 border-t border-slate-50 bg-slate-50/20 report-read-only">
                    ${g.tasks.map(t => ReportController.createReportTaskCard(t)).join('')}
                </div>
            </div>`;
        }).join('');
        if (window.lucide) lucide.createIcons();
    },

    focusTaskFromUrl: function () {
        const urlParams = new URLSearchParams(window.location.search);
        const taskId = urlParams.get('focus_task');
        if (!taskId) return;

        setTimeout(() => {
            const taskCard = document.getElementById('task-card-' + taskId);

            if (taskCard) {
                const accordionContent = taskCard.closest('[id^="acc-"]');
                if (accordionContent && accordionContent.classList.contains('hidden')) {
                    this.toggleAccordion(accordionContent.id);
                }

                setTimeout(() => {
                    taskCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    taskCard.style.transition = "all 0.5s ease-in-out";
                    taskCard.style.boxShadow = "0 0 0 4px #818cf8, 0 10px 15px -3px rgba(0, 0, 0, 0.1)";
                    taskCard.style.backgroundColor = "#eff6ff";

                    setTimeout(() => {
                        taskCard.style.boxShadow = "";
                        taskCard.style.backgroundColor = "";
                    }, 3000);

                    window.history.replaceState({}, document.title, "?tab=reports&view=assign");
                }, 100);
            }
        }, 500);
    },

    showTooltip(e, label, total, done, perf) {
        const tt = document.getElementById('chart-tooltip');
        tt.innerHTML = `<div class="p-4 bg-[#1e293b] text-white rounded-[24px] shadow-2xl border border-white/10 min-w-[180px] backdrop-blur-md">
            <div class="flex items-center gap-2 mb-3 border-b border-white/5 pb-2"><i data-lucide="calendar" width="12" class="text-indigo-400"></i><span class="text-[10px] font-black uppercase tracking-widest">${label}</span></div>
            <div class="space-y-2">
                <div class="flex justify-between text-[10px] font-bold"><span class="opacity-40 uppercase">Tổng số</span><span>${total}</span></div>
                <div class="flex justify-between text-[10px] font-bold text-indigo-400"><span class="uppercase">Hoàn thành</span><span>${done}</span></div>
                <div class="pt-2 mt-2 border-t border-white/10 flex justify-between items-center"><span class="text-[9px] font-black opacity-30 uppercase">Hiệu suất</span><span class="text-[14px] font-[1000] text-emerald-400">${perf}%</span></div>
            </div></div>`;
        tt.classList.remove('opacity-0', 'hidden');
        tt.style.left = (e.clientX + 15) + 'px';
        tt.style.top = (e.clientY - 120) + 'px';
        if (window.lucide) lucide.createIcons();
    },
    hideTooltip: () => { document.getElementById('chart-tooltip')?.classList.add('opacity-0', 'hidden'); },
    toggleAccordion: (id) => {
        const content = document.getElementById(id);
        const icon = document.getElementById('icon-' + id);
        if (content) {
            const isHidden = content.classList.contains('hidden');
            content.classList.toggle('hidden');
            if (icon) icon.classList.toggle('rotate-90', isHidden);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('chart-bars-container')) {
        ReportController.init();
    }
});