// public_html/js/auth.controller.js

const AuthController = {
    login: async (event) => {
        event.preventDefault();
        const form = event.target;
        const username = form.username.value.trim();
        const password = form.password.value.trim();

        if (!username || !password) return;

        // 1. Kích hoạt màn hình loading tuyệt đẹp
        const overlay = document.getElementById('login-loading');
        const box = document.getElementById('loading-box');
        if (overlay && box) {
            overlay.classList.remove('hidden');
            setTimeout(() => {
                overlay.classList.remove('opacity-0');
                box.classList.remove('scale-95');
                box.classList.add('scale-100');
            }, 10);
        }

        // Vẫn gọi Utils.toggleLoading để đồng bộ hiệu ứng nút bấm
        if (window.Utils) Utils.toggleLoading('btn-submit', true, 'ĐANG XỬ LÝ...');

        try {
            // 2. GỌI API LOGIN
            const res = await Utils.callApi('login', { username, password });

            if (res.status === 'success') {
                localStorage.setItem('current_session_user', JSON.stringify(res.user));

                // Cập nhật trạng thái thành công trên màn hình loading
                const title = document.getElementById('loading-title');
                const desc = document.getElementById('loading-desc');
                if (title) title.innerText = "CHÀO MỪNG TRỞ LẠI!";
                if (desc) desc.innerText = "ĐANG TẢI DỮ LIỆU BÀN LÀM VIỆC...";

                // Đợi hiệu ứng kết thúc rồi mới tải lại trang
                setTimeout(() => window.location.reload(), 1200);
            } else {
                // Tắt màn hình loading nếu thất bại
                if (overlay) {
                    overlay.classList.add('opacity-0');
                    setTimeout(() => overlay.classList.add('hidden'), 500);
                }
                alert(res.message || 'Tài khoản hoặc mật khẩu không chính xác!');
            }
        } catch (e) {
            if (overlay) overlay.classList.add('hidden');
            alert('Lỗi kết nối Server!');
        } finally {
            if (window.Utils) Utils.toggleLoading('btn-submit', false, 'ĐANG NHẬP NGAY');
        }
    },

    logout: async () => {
        try {
        // 1. Thông báo cho người dùng biết hệ thống đang xử lý
        window.Utils.showToast("Đang đăng xuất khỏi hệ thống...", "success");

        // 2. Gọi API để xóa Session trên Server
        // Sử dụng callApi từ Utils mà bạn đã định nghĩa
         const res = await window.Utils.callApi('logout');

            if (res.status === 'success') {
            // 3. Xóa dữ liệu phiên làm việc ở máy khách
            localStorage.removeItem('current_session_user');

            // 4. Đợi một chút để người dùng kịp đọc thông báo rồi mới reload
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            } else {
            window.Utils.showToast(res.message || "Lỗi khi đăng xuất", "error");
            }
        } catch (e) {
        // Trường hợp lỗi mạng, vẫn ép xóa local để đảm bảo an toàn
        localStorage.removeItem('current_session_user');
        window.location.reload();
        }
    }
};