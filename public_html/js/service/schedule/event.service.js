/**
 * js/services/schedule/event.service.js
 * Quản lý lên lịch Sự kiện & Thông báo
 */
const EventService = {
    openForm: async (defaultDate) => {
        const now = new Date();
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}`;

        if (!defaultDate) {
            defaultDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        }

        document.getElementById('event-title').value = '';
        document.getElementById('event-start-date').value = defaultDate;
        document.getElementById('event-start-time').value = currentTime;
        document.getElementById('event-end-date').value = defaultDate;
        document.getElementById('event-end-time').value = '23:59';
        document.getElementById('event-content').value = '';

        // Reset Dropdown
        const notifyHidden = document.getElementById('event-notify-hidden');
        if (notifyHidden) {
            if (typeof selectCustomDropdown === 'function') {
                selectCustomDropdown('event-notify', 'ALL', 'Toàn công ty');
            }
        }

        document.getElementById('event-user-list-box').classList.add('hidden');
        EventService.toggleUserSelect();

        document.getElementById('event-form-modal').classList.remove('hidden');
        if (window.lucide) lucide.createIcons();

        await EventService.loadUsers();
    },

    closeForm: () => document.getElementById('event-form-modal').classList.add('hidden'),

    toggleUserSelect: () => {
        const hiddenEl = document.getElementById('event-notify-hidden');
        if (!hiddenEl) return;

        const type = hiddenEl.value;
        const container = document.getElementById('event-user-select-container');

        if (type === 'SPECIFIC') {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
            document.querySelectorAll('input[name="event_specific_users[]"]').forEach(cb => cb.checked = false);
            EventService.updateUserTags();
        }
    },

    toggleUserList: () => {
        document.getElementById('event-user-list-box').classList.toggle('hidden');
    },

    updateUserTags: () => {
        const container = document.getElementById('event-selected-users-tags');
        const checkboxes = document.querySelectorAll('input[name="event_specific_users[]"]:checked');
        let html = '';

        checkboxes.forEach(cb => {
            html += `<span class="px-2.5 py-1.5 bg-white shadow-sm text-slate-700 text-[11px] font-bold rounded-lg flex items-center gap-1.5 border border-slate-200">
                        <i data-lucide="user" width="12" class="text-indigo-600"></i> ${cb.getAttribute('data-name')}
                     </span>`;
        });

        container.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    },

    searchUsers: () => {
        const keyword = document.getElementById('search-event-user-input').value.toLowerCase();
        document.querySelectorAll('.event-user-item').forEach(el => {
            const name = el.querySelector('.user-name').innerText.toLowerCase();
            if (name.includes(keyword)) {
                el.classList.remove('hidden');
                el.classList.add('flex');
            } else {
                el.classList.add('hidden');
                el.classList.remove('flex');
            }
        });
    },

    // GIAO DIỆN CARD CÓ AVATAR Y NHƯ LEAVE
    loadUsers: async () => {
        const container = document.getElementById('event-user-list');
        try {
            const response = await Utils.callApi('fetch_all_staff', {});
            const users = response.data || [];
            let html = '';

            if (users.length > 0) {
                users.forEach(u => {
                    const deptName = u.dept_name || u.role_name || 'Nhân sự';
                    const shortName = Utils.formatShortName(u.fullName);
                    const avatarSrc = Utils.getAvatar(u.avatar, u.fullName, 128);

                    html += `
                    <label class="event-user-item flex items-center justify-between p-3 mb-2 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:border-indigo-200 hover:shadow-sm transition-all group">
                        <input type="checkbox" name="event_specific_users[]" value="${u.id}" data-name="${shortName}" onchange="EventService.updateUserTags()" class="hidden peer">
                        
                        <div class="flex items-center gap-3 overflow-hidden">
                            <img src="${avatarSrc}" class="w-10 h-10 rounded-full object-cover shadow-sm bg-slate-50 shrink-0 border border-slate-100">
                            <div class="flex flex-col truncate">
                                <span class="user-name font-[900] text-[14px] text-slate-700 truncate group-hover:text-indigo-700 transition-colors">${shortName}</span>
                                <span class="text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md w-max mt-1 border border-slate-100">${deptName}</span>
                            </div>
                        </div>

                        <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all bg-slate-50 text-slate-400 peer-checked:bg-indigo-600 peer-checked:text-white border border-slate-200 peer-checked:border-indigo-600 shadow-sm">
                            <i data-lucide="plus" width="14"></i>
                        </div>
                    </label>`;
                });
                container.innerHTML = html;
                EventService.updateUserTags();
            } else {
                container.innerHTML = '<div class="text-xs text-center text-slate-400 py-4 font-bold">Không tìm thấy nhân viên nào!</div>';
            }
        } catch (error) { }
    },

    submitForm: async (e) => {
        e.preventDefault();
        const title = document.getElementById('event-title').value;
        const startDate = document.getElementById('event-start-date').value;
        const startTime = document.getElementById('event-start-time').value;
        let endDate = document.getElementById('event-end-date').value || startDate;
        let endTime = document.getElementById('event-end-time').value || '23:59';

        const notifyType = document.getElementById('event-notify-hidden').value;
        let notifyUsers = [];

        if (notifyType === 'SPECIFIC') {
            const checkboxes = document.querySelectorAll('input[name="event_specific_users[]"]:checked');
            notifyUsers = Array.from(checkboxes).map(cb => cb.value);
            if (notifyUsers.length === 0) return Utils.showToast("Vui lòng tick chọn ít nhất 1 người!", "error");
        }

        const content = document.getElementById('event-content').value;

        Utils.showToast('Đang tạo và phát thông báo...', 'info');
        try {
            const res = await Utils.callApi('create_event', { title, start_datetime: `${startDate} ${startTime}:00`, end_datetime: `${endDate} ${endTime}:00`, notify_type: notifyType, notify_users: notifyUsers, content });

            if (res && res.status === 'success') {
                EventService.closeForm();
                Utils.showToast('Đã phát thông báo thành công!', 'success');
                if (typeof ScheduleController !== 'undefined') ScheduleController.renderCalendar();
            } else {
                Utils.showToast(res ? res.message : 'Lỗi hệ thống', 'error');
            }
        } catch (error) { }
    }
};