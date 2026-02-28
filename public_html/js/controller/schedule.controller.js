/*
 * js/controller/schedule.controller.js
 */

const ScheduleController = {
    state: {
        currentDate: new Date(),
        selectedDate: null,
        role: 'STAFF'
    },

    // Tạo bộ nhớ tạm để Modal "Xem thêm" có thể lấy dữ liệu
    allEventsCache: [],

    init: () => {
        const user = JSON.parse(localStorage.getItem('current_session_user') || '{}');
        ScheduleController.state.role = user.role || 'STAFF';

        const currentRole = ScheduleController.state.role.toUpperCase();
        const managerRoles = ['MANAGER', 'ADMIN', 'SUPER_ADMIN', 'SUPER ADMIN'];

        if (managerRoles.includes(currentRole)) {
            document.getElementById('btn-quick-event')?.classList.remove('hidden');
            document.getElementById('modal-btn-event')?.classList.remove('hidden');
        } else {
            document.getElementById('btn-quick-event')?.classList.add('hidden');
            document.getElementById('modal-btn-event')?.classList.add('hidden');
        }
        ScheduleController.renderCalendar();
    },

    pickerYear: new Date().getFullYear(),
    toggleMonthPicker: (e) => {
        if (e) e.stopPropagation();
        const popup = document.getElementById('month-picker-popup');
        popup.classList.toggle('hidden');
        if (!popup.classList.contains('hidden')) {
            ScheduleController.pickerYear = ScheduleController.state.currentDate.getFullYear();
            ScheduleController.renderMonthPicker();
        }
    },
    changePickerYear: (offset) => { ScheduleController.pickerYear += offset; ScheduleController.renderMonthPicker(); },
    renderMonthPicker: () => {
        document.getElementById('picker-year-display').innerText = ScheduleController.pickerYear;
        const grid = document.getElementById('picker-months-grid');
        let html = '';
        const currentM = ScheduleController.state.currentDate.getMonth();
        const currentY = ScheduleController.state.currentDate.getFullYear();
        for (let i = 0; i < 12; i++) {
            const isSelected = (i === currentM && ScheduleController.pickerYear === currentY);
            const activeClass = isSelected ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600';
            html += `<button onclick="ScheduleController.jumpToDate(${ScheduleController.pickerYear}, ${i})" class="py-2 rounded-lg text-xs font-bold transition-all ${activeClass}">T${i + 1}</button>`;
        }
        grid.innerHTML = html;
    },
    jumpToDate: (year, month) => {
        ScheduleController.state.currentDate = new Date(year, month, 1);
        document.getElementById('month-picker-popup').classList.add('hidden');
        ScheduleController.renderCalendar();
    },
    changeMonth: (offset) => {
        const newDate = new Date(ScheduleController.state.currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        ScheduleController.state.currentDate = newDate;
        ScheduleController.renderCalendar();
    },

    // ===============================================
    // HÀM VẼ LỊCH CHÍNH
    // ===============================================
    renderCalendar: async () => {
        const year = ScheduleController.state.currentDate.getFullYear();
        const month = ScheduleController.state.currentDate.getMonth();

        const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
        document.getElementById('calendar-month-year').innerText = `${monthNames[month]} / ${year}`;

        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '<div class="col-span-7 text-center py-10 text-slate-400 font-bold animate-pulse">Đang tải dữ liệu lịch...</div>';

        let allEvents = [];
        try {
            const res = await Utils.callApi('get_events_for_calendar', {});
            if (res && res.status === 'success') {
                allEvents = res.data || [];
                ScheduleController.allEventsCache = allEvents;
            }
        } catch (err) { }

        grid.innerHTML = '';

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let emptyDays = firstDayOfMonth - 1;
        if (emptyDays === -1) emptyDays = 6;

        const today = new Date();
        const fixedHolidays = { "01-01": "Tết Dương Lịch", "04-30": "Giải phóng MN", "05-01": "Quốc tế LĐ", "09-02": "Quốc khánh" };

        for (let i = 0; i < emptyDays; i++) {
            grid.innerHTML += `<div class="h-[100px] md:h-[130px] bg-slate-50/30 rounded-[24px] border-2 border-dashed border-slate-100/50 opacity-40 pointer-events-none"></div>`;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = (day === today.getDate() && month === today.getMonth() && year === today.getFullYear());
            const mm_dd = `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dateStr = `${year}-${mm_dd}`;
            const displayDateStr = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;

            const holidayName = fixedHolidays[mm_dd];
            const currentDayOfWeek = new Date(year, month, day).getDay();
            const isWeekend = currentDayOfWeek === 0 || currentDayOfWeek === 6;

            let bgClass = 'bg-white border-slate-100/80 hover:border-indigo-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5';
            let textClass = 'text-slate-500 bg-slate-50 group-hover:bg-indigo-50 group-hover:text-indigo-600';

            if (holidayName && !isToday) {
                bgClass = 'bg-rose-50/30 border-rose-100 hover:border-rose-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5';
                textClass = 'text-rose-500 bg-rose-50 group-hover:bg-rose-100 group-hover:text-rose-600';
            }

            if (isToday) {
                bgClass = 'bg-gradient-to-br from-indigo-50/80 to-white border-indigo-200 ring-4 ring-indigo-50/50 shadow-sm hover:-translate-y-0.5 hover:shadow-md';
                textClass = 'bg-indigo-600 text-white shadow-md shadow-indigo-200 group-hover:bg-indigo-700 group-hover:text-white';
            } else if (isWeekend && !holidayName) {
                textClass = 'text-rose-400 bg-rose-50/50 group-hover:bg-rose-100 group-hover:text-rose-600';
            }

            let holidayHTML = '';
            if (holidayName) {
                holidayHTML = `<span class="text-[8px] font-[900] text-rose-500 bg-rose-100 px-2 py-1 rounded-md uppercase tracking-widest z-10 truncate max-w-[70%] text-right shadow-sm border border-rose-200/50">${holidayName}</span>`;
            }

            // TÌM SỰ KIỆN TRONG NGÀY
            const eventsToday = allEvents.filter(ev => {
                const evStart = ev.start_datetime.split(' ')[0];
                const evEnd = ev.end_datetime ? ev.end_datetime.split(' ')[0] : evStart;
                return dateStr >= evStart && dateStr <= evEnd;
            });

            let eventsHTML = '';
            let plusIconHTML = '';

            // [ĐÃ SỬA] ĐỔI GIỚI HẠN HIỂN THỊ TỪ 3 THÀNH 2
            const MAX_VISIBLE = 2;
            const visibleEvents = eventsToday.slice(0, MAX_VISIBLE);
            const hiddenCount = eventsToday.length - MAX_VISIBLE;

            if (eventsToday.length > 0) {
                visibleEvents.forEach(ev => {
                    eventsHTML += ScheduleController.buildEventBadgeHTML(ev);
                });

                if (hiddenCount > 0) {
                    eventsHTML += `
                        <div onclick="event.stopPropagation(); ScheduleController.viewMoreEvents('${dateStr}', '${displayDateStr}')" 
                             class="mt-1 text-[10px] font-black text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors px-1 text-center bg-slate-50 hover:bg-indigo-50 py-1 rounded-[6px]">
                            + ${hiddenCount} mục khác...
                        </div>
                    `;
                }
            } else {
                plusIconHTML = `
                    <div class="absolute inset-0 m-auto w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-50 group-hover:scale-100 z-0">
                        <i data-lucide="plus" width="20" class="text-indigo-500"></i>
                    </div>
                `;
            }

            grid.innerHTML += `
                <div onclick="ScheduleController.openActionModal('${dateStr}', null, '${displayDateStr}')" 
                     class="h-[100px] md:h-[130px] p-2 md:p-3 rounded-[24px] border-2 cursor-pointer transition-all duration-300 group relative flex flex-col overflow-hidden ${bgClass}">
                    
                    ${plusIconHTML}

                    <div class="flex justify-between items-start z-10 shrink-0">
                        <div class="w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center text-xs md:text-sm font-black transition-colors ${textClass}">
                            ${day}
                        </div>
                        ${holidayHTML}
                    </div>

                    <div class="mt-1.5 flex flex-col z-10 overflow-hidden gap-1" id="events-${dateStr}">
                        ${eventsHTML}
                    </div>
                </div>
            `;
        }

        if (window.lucide) lucide.createIcons();
    },

    buildEventBadgeHTML: (ev) => {
        let itemBg = 'bg-indigo-50';
        let itemText = 'text-indigo-700';
        let itemBorder = 'border-indigo-100/50';
        let itemHover = 'hover:bg-indigo-100';
        let timeHtml = '';

        if (ev.type === 'LEAVE') {
            if (ev.title.includes('Chờ duyệt nghỉ phép')) {
                itemBg = 'bg-amber-50'; itemText = 'text-amber-700'; itemBorder = 'border-amber-200/50'; itemHover = 'hover:bg-amber-100';
            } else if (ev.title.includes('Từ chối nghỉ phép')) {
                itemBg = 'bg-rose-50'; itemText = 'text-rose-700'; itemBorder = 'border-rose-200/50'; itemHover = 'hover:bg-rose-100';
            } else {
                itemBg = 'bg-emerald-50'; itemText = 'text-emerald-700'; itemBorder = 'border-emerald-200/50'; itemHover = 'hover:bg-emerald-100';
            }
        } else {
            const timeStr = ev.start_datetime.split(' ')[1].substring(0, 5);
            timeHtml = `<span class="opacity-60 font-semibold mr-1 shrink-0">${timeStr}</span>`;
        }

        return `
            <div onclick="event.stopPropagation(); DetailService.open('${ev.type}', ${ev.id})" 
                 class="flex items-center px-2 py-1 ${itemBg} ${itemText} rounded-[6px] text-[10px] font-bold truncate border ${itemBorder} cursor-pointer ${itemHover} transition-colors shadow-sm" title="${ev.title}">
                ${timeHtml} <span class="truncate">${ev.title}</span>
            </div>
        `;
    },

    viewMoreEvents: (dateStr, displayDateStr) => {
        const eventsThatDay = ScheduleController.allEventsCache.filter(ev => {
            const evStart = ev.start_datetime.split(' ')[0];
            const evEnd = ev.end_datetime ? ev.end_datetime.split(' ')[0] : evStart;
            return dateStr >= evStart && dateStr <= evEnd;
        });

        let html = '';
        eventsThatDay.forEach(ev => {
            let badge = ScheduleController.buildEventBadgeHTML(ev);
            badge = badge.replace('text-[10px]', 'text-xs px-3 py-2');
            html += badge;
        });

        document.getElementById('more-events-date').innerText = displayDateStr;
        document.getElementById('more-events-list').innerHTML = html;
        document.getElementById('more-events-modal').classList.remove('hidden');
    },

    closeMoreEventsModal: () => {
        document.getElementById('more-events-modal').classList.add('hidden');
    },

    openActionModal: (dateStr, directAction = null, displayDateStr = null) => {
        if (!dateStr) {
            const today = new Date();
            dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            displayDateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
        }
        ScheduleController.state.selectedDate = dateStr;
        document.getElementById('modal-selected-date').innerText = displayDateStr;

        if (directAction) { ScheduleController.proceedToForm(directAction); return; }
        document.getElementById('schedule-action-modal').classList.remove('hidden');
    },
    closeActionModal: () => { document.getElementById('schedule-action-modal').classList.add('hidden'); },
    proceedToForm: (actionType) => {
        ScheduleController.closeActionModal();
        const date = ScheduleController.state.selectedDate;
        if (actionType === 'LEAVE') LeaveService.openForm(date);
        else if (actionType === 'EVENT') EventService.openForm(date);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('schedule-view-container')) {
        ScheduleController.init();
    }
});

document.addEventListener('click', (e) => {
    const popup = document.getElementById('month-picker-popup');
    if (popup && !popup.classList.contains('hidden') && !e.target.closest('.relative')) {
        popup.classList.add('hidden');
    }
});