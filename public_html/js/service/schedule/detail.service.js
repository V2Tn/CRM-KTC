/**
 * js/service/schedule/detail.service.js
 * Quản lý View Chi tiết Sự kiện & Nghỉ phép
 */
const DetailService = {
    currentLeaveId: null,

    open: async (type, id) => {
        // Tự động đóng Modal "Xem thêm" nếu nó đang mở
        if (typeof ScheduleController !== 'undefined' && typeof ScheduleController.closeMoreEventsModal === 'function') {
            ScheduleController.closeMoreEventsModal();
        }

        document.getElementById('detail-title').innerText = 'Đang tải dữ liệu...';
        document.getElementById('detail-event-info')?.classList.add('hidden');
        document.getElementById('detail-leave-info')?.classList.add('hidden');
        document.getElementById('detail-leave-actions')?.classList.add('hidden');
        document.getElementById('detail-leave-actions')?.classList.remove('flex');
        document.getElementById('detail-default-actions')?.classList.remove('hidden');
        document.getElementById('detail-modal').classList.remove('hidden');

        try {
            const res = await Utils.callApi('get_schedule_detail', { type: type, id: id });

            if (res && res.status === 'success' && res.data) {
                const data = res.data;
                const currentUser = JSON.parse(localStorage.getItem('current_session_user') || '{}');

                document.getElementById('detail-title').innerText = data.title;
                const badge = document.getElementById('detail-type-badge');

                if (type === 'EVENT') {
                    document.getElementById('detail-content').innerText = data.content || 'Không có ghi chú thêm.';
                    document.getElementById('detail-event-info').classList.remove('hidden');
                    document.getElementById('detail-creator').innerText = data.creator_name;
                    document.getElementById('detail-event-start').innerText = data.start_time;
                    document.getElementById('detail-event-end').innerText = data.end_time;

                    badge.className = 'text-[10px] font-bold uppercase mt-2 px-3 py-1 rounded-md inline-block bg-indigo-100 text-indigo-600';
                    badge.innerText = 'SỰ KIỆN CÔNG TY';
                }
                else if (type === 'LEAVE') {
                    DetailService.currentLeaveId = data.id;
                    document.getElementById('detail-leave-info').classList.remove('hidden');

                    // [ĐÃ SỬA] In nhãn Loại Phép ra ngay lập tức
                    badge.className = 'text-[10px] font-bold uppercase mt-2 px-3 py-1 rounded-md inline-block bg-rose-100 text-rose-600';
                    badge.innerText = `LOẠI: ${data.leave_type || 'PHÉP NĂM'}`;

                    // Đổ dữ liệu text
                    document.getElementById('detail-leave-requester').innerText = data.requester_name || '--';
                    document.getElementById('detail-leave-start').innerText = data.start_time || '--';
                    document.getElementById('detail-leave-end').innerText = data.end_time || '--';
                    document.getElementById('detail-leave-manager').innerText = data.creator_name || 'Chưa rõ';
                    document.getElementById('detail-leave-followers').innerText = data.followers_name || 'Không có';

                    // Xử lý màu sắc Trạng thái
                    const statusEl = document.getElementById('detail-leave-status');
                    if (data.status === 'APPROVED') {
                        statusEl.innerText = 'ĐÃ DUYỆT';
                        statusEl.className = 'text-[10px] font-black px-2 py-1 rounded bg-emerald-100 text-emerald-600 uppercase';
                    } else if (data.status === 'REJECTED') {
                        statusEl.innerText = 'TỪ CHỐI';
                        statusEl.className = 'text-[10px] font-black px-2 py-1 rounded bg-rose-100 text-rose-600 uppercase';
                    } else {
                        statusEl.innerText = 'CHỜ DUYỆT';
                        statusEl.className = 'text-[10px] font-black px-2 py-1 rounded bg-amber-100 text-amber-600 uppercase';
                    }

                    // =====================================
                    // LOGIC BẢO MẬT: ẨN/HIỆN NỘI DUNG VÀ NOTE
                    // =====================================
                    const reasonWrapper = document.getElementById('detail-leave-reason-wrapper');
                    const noteWrapper = document.getElementById('detail-leave-manager-note-wrapper');

                    if (data.has_permission) {
                        if (reasonWrapper) reasonWrapper.classList.remove('hidden');
                        document.getElementById('detail-content').innerText = data.content || 'Không có ghi chú thêm.';

                        if (data.manager_note && data.manager_note.trim() !== '') {
                            if (noteWrapper) noteWrapper.classList.remove('hidden');
                            document.getElementById('detail-leave-manager-note-text').innerText = data.manager_note;
                        } else {
                            if (noteWrapper) noteWrapper.classList.add('hidden');
                        }
                    } else {
                        if (reasonWrapper) reasonWrapper.classList.add('hidden');
                        if (noteWrapper) noteWrapper.classList.add('hidden');
                    }

                    // CHECK QUYỀN VÀ HIỆN FORM NHẬP NOTE CỦA SẾP
                    if (data.status === 'PENDING' && (data.manager_id == currentUser.id || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN')) {
                        document.getElementById('detail-manager-note-input').value = '';
                        document.getElementById('detail-default-actions').classList.add('hidden');
                        document.getElementById('detail-leave-actions').classList.remove('hidden');
                        document.getElementById('detail-leave-actions').classList.add('flex');
                    }
                }
                if (window.lucide) lucide.createIcons();
            }
        } catch (error) { console.error(error); }
    },

    processLeave: async (statusAction) => {
        if (!DetailService.currentLeaveId) return;

        // [ĐÃ SỬA] Đảm bảo lấy được nội dung từ ô textarea
        const managerNote = document.getElementById('detail-manager-note-input').value;

        Utils.showToast('Đang xử lý...', 'info');
        try {
            const res = await Utils.callApi('approve_leave_request', {
                id: DetailService.currentLeaveId,
                status: statusAction,
                manager_note: managerNote // Gửi lên Backend
            });

            if (res && res.status === 'success') {
                Utils.showToast(res.message, 'success');
                DetailService.close();
                if (typeof ScheduleController !== 'undefined') ScheduleController.renderCalendar();
            } else {
                Utils.showToast(res.message || 'Lỗi xử lý', 'error');
            }
        } catch (error) {
            Utils.showToast('Lỗi máy chủ', 'error');
        }
    },

    close: () => document.getElementById('detail-modal').classList.add('hidden'),

    checkUrlParams: () => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('view_type') && urlParams.get('view_id')) {
            DetailService.open(urlParams.get('view_type'), urlParams.get('view_id'));
            window.history.replaceState({}, document.title, window.location.pathname + "?tab=schedule");
        }
    }
};

document.addEventListener('DOMContentLoaded', () => { setTimeout(() => { DetailService.checkUrlParams(); }, 500); });