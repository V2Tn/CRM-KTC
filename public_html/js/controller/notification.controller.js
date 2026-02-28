/**
 * js/controller/notification.controller.js
 * Quản lý: Polling thông báo, Hiển thị chuông, Tự động reload dữ liệu (View 3 & Team)
 */
const NotificationController = {
    hasUnread: false,
    interval: null,
    lastNotiId: 0,

   init: () => {
        console.log("Notification System Started (Powered by Pusher)");
        NotificationController.fetch(); // Lấy dữ liệu lần đầu
        
        const sessionUser = JSON.parse(localStorage.getItem('current_session_user') || '{}');
        const myUserId = parseInt(sessionUser.id);

        // Kiểm tra xem đã nhúng thư viện Pusher chưa
        if (typeof Pusher === 'undefined') {
            console.error("LỖI: Chưa nhúng thư viện Pusher vào file index.php!");
            return;
        }

        // Khởi tạo Pusher bằng Key của Kim Tâm Cát
        const pusher = new Pusher('c5f3d216943b00f1f6cd', {
            cluster: 'ap1'
        });

        // Bật kênh lắng nghe
        const channel = pusher.subscribe('ktc-notifications');
       channel.bind('new-notification', function (data) {
           // KIỂM TRA ĐÚNG NGƯỜI NHẬN MỚI XỬ LÝ
           if (data.receivers && data.receivers.includes(myUserId)) {
               console.log("Pusher: Có tín hiệu mới từ Server!");

               // 1. Cập nhật chuông thông báo
               if (typeof NotificationController !== 'undefined') {
                   NotificationController.fetch();
               }

               // Lấy params 1 lần dùng chung cho đỡ tốn bộ nhớ
               const urlParams = new URLSearchParams(window.location.search);
               const currentTab = urlParams.get('tab');

               // 2. Nếu đang ở tab Giao việc -> Load lại công việc
               if (!currentTab || currentTab === 'tasks') {
                   if (window.TaskController && typeof window.TaskController.loadTasks === 'function') {
                       window.TaskController.loadTasks();
                   }
               }

               // 3. Nếu đang ở tab Hành chính -> Load ngầm lại Lịch
               if (currentTab === 'schedule') {
                   if (typeof ScheduleController !== 'undefined' && typeof ScheduleController.renderCalendar === 'function') {
                       // Đợi 500ms cho Backend nhả DB xong rồi vẽ lại lịch
                       setTimeout(() => {
                           ScheduleController.renderCalendar();
                       }, 500);
                   }
               }
           }
       });

        // Sự kiện click ra ngoài để đóng menu chuông
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('noti-dropdown');
            const btn = document.querySelector('[onclick="NotificationController.toggle()"]');
            if (dropdown && !dropdown.classList.contains('hidden') && !dropdown.contains(e.target) && btn && !btn.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
    },

    fetch: async () => {
        // Gọi API lấy thông báo
        const res = await Utils.callApi('fetch_notifications');

        if (res.status === 'success') {
            NotificationController.renderBadge(res.unread_count);
            NotificationController.renderList(res.notifications);

            // [LOGIC MỚI] Kiểm tra có thông báo MỚI TINH không để show Toast
            if (res.notifications && res.notifications.length > 0) {
                const topNoti = res.notifications[0]; // Thông báo mới nhất luôn ở đầu mảng

                if (NotificationController.lastNotiId === 0) {
                    // Lần load trang đầu tiên -> chỉ ghi nhận ID mới nhất
                    NotificationController.lastNotiId = topNoti.id;
                } else if (topNoti.id > NotificationController.lastNotiId) {
                    // Nếu có thông báo mới tinh

                    // 1. Phân loại màu sắc Toast tùy theo hành động
                    let toastColor = 'success'; // Mặc định xanh lá
                    if (topNoti.type === 'TASK_CANCEL') {
                        toastColor = 'error';
                    } else if (topNoti.type === 'TASK_REDO' || topNoti.type === 'NEW_TASK' || topNoti.type === 'TASK_REMIND') {
                        toastColor = 'info'; // Màu xanh cho nhắc nhở
                    } else if (topNoti.type === 'EVENT_REMINDER') {
                        toastColor = 'warning'; // Màu vàng cho sự kiện sắp diễn ra
                    }

                    // 2. Hiện Toast
                    if (window.Utils) {
                        window.Utils.showToast(topNoti.message, toastColor);
                    }

                    // 3. Phát âm thanh Ping
                    NotificationController.playPing();

                    // 4. Cập nhật ID
                    NotificationController.lastNotiId = topNoti.id;
                }
            }
            // Cập nhật trạng thái chưa đọc
            NotificationController.hasUnread = (res.unread_count > 0);
        }
    },

    // Hàm tự động reload dữ liệu dựa trên loại thông báo
    handleAutoReload: (noti) => {
        console.log("🔄 Phát hiện thay đổi từ: " + noti.type);

        // 1. Nếu là Task Mới -> Reload danh sách Task (nếu đang ở trang Task)
        if (noti.type === 'NEW_TASK') {
            if (window.TaskController && typeof window.TaskController.loadTasks === 'function') {
                window.TaskController.loadTasks();
                Utils.showToast('Có công việc mới vừa được giao!', 'info');
            }
            // Nếu đang xem chi tiết nhân viên (View 3 của Team)
            if (window.TeamController && TeamController.state.currentView === 'member-detail') {
               TeamController.loadMemberTasks(TeamController.state.selectedUserId);
            }
        }

        // 2. Nếu là Đánh giá Mới -> Reload trang Team (để hiện huy hiệu)
        if (noti.type === 'EVALUATION') {
            if (window.TeamController && typeof window.TeamController.loadData === 'function') {
                window.TeamController.loadData();
                Utils.showToast('Bạn vừa nhận được đánh giá mới!', 'success');
            }
        }
    },

    renderBadge: (count) => {
        const badge = document.getElementById('noti-badge');
        if (!badge) return;
        if (count > 0) {
            badge.innerText = count > 99 ? '99+' : count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
            NotificationController.hasUnread = false; // Reset trạng thái
        }
    },

    renderList: (list) => {
        const container = document.getElementById('noti-list');
        if (!container) return;

        if (!list || list.length === 0) {
            container.innerHTML = '<div class="p-6 text-center text-slate-400 text-xs font-bold">Không có thông báo nào</div>';
            return;
        }

        let html = '';
        list.forEach(item => {
            const isUnread = item.is_read == 0;
            const bgClass = isUnread ? 'bg-indigo-50/50' : 'bg-white';
            const dotHtml = isUnread ? '<div class="w-2 h-2 rounded-full bg-rose-500 shrink-0 shadow-sm shadow-rose-200"></div>' : '';

            html += `
            <div onclick="NotificationController.markRead(${item.id}, ${item.related_id}, '${item.type}')" 
                 class="p-4 ${bgClass} hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0 flex items-start gap-3 group">
                
                <div class="mt-0.5 shrink-0 text-indigo-500">
                    <i data-lucide="bell" width="16"></i>
                </div>
                
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-bold text-slate-700 leading-snug mb-1 group-hover:text-indigo-600 transition-colors">${item.message}</p>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">${NotificationController.timeSince(new Date(item.created_at))}</p>
                </div>
                
                ${dotHtml} </div>`;
        });
        container.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    },

    toggle: () => {
        const dropdown = document.getElementById('noti-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
        }
    },

    markRead: async (notiId = null, relatedId = null, type = '') => {

        if (!notiId) {
            // NẾU KHÔNG CÓ ID -> ĐÂY LÀ HÀNH ĐỘNG "ĐỌC TẤT CẢ"
            await Utils.callApi('mark_read', {});
            Utils.showToast("Đã đánh dấu đọc tất cả", "success");
            NotificationController.fetch(); // Tải lại list cho mất dấu chấm đỏ
            return;
        }

        // NẾU CÓ ID -> ĐÁNH DẤU 1 CÁI VÀ CHUYỂN HƯỚNG
        await Utils.callApi('mark_read', { noti_id: notiId });
        document.getElementById('noti-dropdown')?.classList.add('hidden');

        const taskTypes = ['TASK_DONE', 'TASK_CANCEL', 'TASK_REDO'];

        if (taskTypes.includes(type) && relatedId) {
            window.location.href = `?tab=reports&view=assign&filter=all&focus_task=${relatedId}`;
        }
        else if (type === 'NEW_TASK') {
            window.location.href = `?tab=tasks`;
        }
        else if (type === 'NEW_EVENT' || type === 'EVENT_REMINDER') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('tab') === 'schedule') {
                if (typeof DetailService !== 'undefined') DetailService.open('EVENT', relatedId);
                else window.location.href = `?tab=schedule&view_type=EVENT&view_id=${relatedId}`;
            } else {
                window.location.href = `?tab=schedule&view_type=EVENT&view_id=${relatedId}`;
            }
        }
        else if (type === 'LEAVE_REQUEST' || type === 'LEAVE_RESPONSE') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('tab') === 'schedule') {
                if (typeof DetailService !== 'undefined') DetailService.open('LEAVE', relatedId);
                else window.location.href = `?tab=schedule&view_type=LEAVE&view_id=${relatedId}`;
            } else {
                window.location.href = `?tab=schedule&view_type=LEAVE&view_id=${relatedId}`;
            }
        }
        else {
            NotificationController.fetch();
        }
    },
    deleteNoti: async (notiId, event) => {
        if (event) event.stopPropagation();

        const res = await Utils.callApi('delete_notification', { noti_id: notiId });
        if (res.status === 'success') {
            NotificationController.fetch(); // Tải lại list cho mất đi
        }
    },

    // [TÍNH NĂNG MỚI: XÓA TOÀN BỘ ĐÃ ĐỌC]
    deleteAllRead: async (event) => {
        if (event) event.stopPropagation(); // Giữ popup không bị đóng

        // Gọi API với type = 'all_read'
        const res = await Utils.callApi('delete_notification', { type: 'all_read' });

        if (res.status === 'success') {
            Utils.showToast("Đã dọn dẹp thư báo", "success");
            NotificationController.fetch(); // Tải lại để xóa khỏi màn hình
        }
    },

    playPing: () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => {}); 
    },

    timeSince: (date) => {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " năm trước";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " tháng trước";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " ngày trước";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " giờ trước";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " phút trước";
        return "Vừa xong";
    }
};

// Start
NotificationController.init();