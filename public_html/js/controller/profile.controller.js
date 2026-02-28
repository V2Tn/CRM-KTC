/**
 * js/profile.controller.js
 * Quản lý Modal Hồ Sơ Cá Nhân (Header & Global) - Có Upload Avatar
 */
const ProfileController = {

    // 1. Mở Profile của chính mình
    openMyProfile: function () {
        const user = JSON.parse(localStorage.getItem('current_session_user') || '{}');
        if (user && user.id) {
            this.openModal(user.id);
        } else {
            alert("Không tìm thấy phiên đăng nhập!");
        }
    },

    // 2. Mở Modal & Lấy dữ liệu mới nhất
    openModal: async function (userId) {
        const res = await Utils.callApi('get_profile_info', { user_id: userId });
        if (res.status === 'success') {
            this._renderModalHTML(res.user);
        } else {
            alert(res.message || 'Lỗi tải thông tin');
        }
    },

    // 3. Xử lý Upload Avatar
    uploadAvatar: async function (input) {
        const file = input.files[0];
        if (!file) return;

        // Preview ảnh ngay lập tức
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('profile-preview-img').src = e.target.result;
        };
        reader.readAsDataURL(file);

        // Chuẩn bị FormData gửi lên server
        const formData = new FormData();
        formData.append('action', 'upload_avatar');
        formData.append('avatar', file);

        if (window.Utils) window.Utils.showToast('Đang tải ảnh lên...', 'info');

        try {
            // Gửi request (Dùng fetch trực tiếp để gửi FormData)
            const response = await fetch('api.php', {
                method: 'POST',
                body: formData
            });
            const res = await response.json();

            if (res.status === 'success') {
                if (window.Utils) window.Utils.showToast('Đổi ảnh đại diện thành công!', 'success');

                // Cập nhật LocalStorage
                const currentUser = JSON.parse(localStorage.getItem('current_session_user') || '{}');
                currentUser.avatar = res.avatarUrl;
                localStorage.setItem('current_session_user', JSON.stringify(currentUser));

                // Cập nhật Avatar trên Header ngay lập tức
                document.querySelectorAll('.user-avatar-display').forEach(img => img.src = res.avatarUrl);

            } else {
                if (window.Utils) window.Utils.showToast(res.message, 'error');
            }
        } catch (e) {
            console.error(e);
            alert('Lỗi upload ảnh');
        }
    },

    // 4. Lưu thông tin Text
    saveProfile: async function (event) {
        event.preventDefault();
        const form = event.target;
        const userId = document.getElementById('profile-user-id').value;
        const btn = document.getElementById('btn-save-profile');

        const originalText = btn.innerText;
        btn.innerText = 'ĐANG LƯU...';
        btn.disabled = true;

        const data = {
            user_id: userId,
            fullname: form.fullName.value.trim(),
            email: form.email.value.trim(),
            phone: form.phone.value.trim(),
            password: form.password.value
        };

        const res = await Utils.callApi('update_profile', data);

        if (res.status === 'success') {
            if (window.Utils) Utils.showToast('Cập nhật thành công!', 'success');

            const currentUser = JSON.parse(localStorage.getItem('current_session_user') || '{}');
            if (currentUser.id == userId) {
                currentUser.fullName = data.fullname;
                localStorage.setItem('current_session_user', JSON.stringify(currentUser));

                const headerName = document.getElementById('header-user-name');
                if (headerName) headerName.innerText = data.fullname;
            }
            this.closeModal();
        } else {
            alert(res.message);
        }
        btn.innerText = originalText;
        btn.disabled = false;
    },

    closeModal: function () {
        const modal = document.getElementById('global-profile-modal');
        if (modal) modal.remove();
    },

    // 5. Render Giao diện Modal
    _renderModalHTML: function (user) {
        this.closeModal();

        // Kiểm tra avatar
        const hasAvatar = user.avatar && user.avatar.length > 0;
        const avatarSrc = hasAvatar ? user.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random&size=128`;

        const html = `
        <div id="global-profile-modal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-['Lexend'] animate-in fade-in duration-200">
            <div class="absolute inset-0 bg-[#1e1b4b]/60 backdrop-blur-sm" onclick="ProfileController.closeModal()"></div>
            
            <div class="relative w-full max-w-[800px] bg-white rounded-[32px] shadow-2xl animate-in zoom-in duration-300 transform scale-100">
                
                <div class="absolute -top-12 left-1/2 -translate-x-1/2">
                    <div class="relative group cursor-pointer" onclick="document.getElementById('input-avatar-upload').click()">
                        <div class="w-24 h-24 rounded-[30px] p-1.5 bg-white shadow-xl shadow-indigo-900/10 transition-transform group-hover:scale-105">
                            <img id="profile-preview-img" src="${avatarSrc}" class="w-full h-full rounded-[24px] object-cover border border-slate-100">
                        </div>
                        
                        <div class="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center border-4 border-white shadow-md group-hover:bg-indigo-500 transition-colors">
                            <i data-lucide="camera" width="14"></i>
                        </div>

                        <input type="file" id="input-avatar-upload" class="hidden" accept="image/*" onchange="ProfileController.uploadAvatar(this)">
                    </div>
                </div>

                <button onclick="ProfileController.closeModal()" class="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-rose-500 transition-all">
                    <i data-lucide="x" width="20"></i>
                </button>

                <form onsubmit="ProfileController.saveProfile(event)" class="pt-16 px-8 pb-10 md:px-10 mt-4">
                    <input type="hidden" id="profile-user-id" value="${user.id}">
                    
                    <h3 class="text-center text-xl font-[900] text-slate-800 uppercase tracking-tight mb-1">
                        ${user.fullName}
                    </h3>
                    <p class="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
                        ${user.role_name || 'Thành viên'} - ${user.dept_name || 'Chưa phân phòng'}
                    </p>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div class="space-y-5">
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Họ và tên</label>
                                <input type="text" name="fullName" value="${user.fullName}" required 
                                    class="w-full px-5 py-3.5 bg-[#f8fafc] border-2 border-transparent focus:border-indigo-200 focus:bg-white rounded-2xl font-bold text-slate-700 text-sm outline-none transition-all placeholder-slate-300">
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Tài khoản</label>
                                <input type="text" value="${user.username}" disabled
                                    class="w-full px-5 py-3.5 bg-slate-100 border-2 border-transparent rounded-2xl font-bold text-slate-500 text-sm outline-none cursor-not-allowed">
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Email</label>
                                <input type="email" name="email" value="${user.email || ''}"
                                    class="w-full px-5 py-3.5 bg-[#f8fafc] border-2 border-transparent focus:border-indigo-200 focus:bg-white rounded-2xl font-bold text-slate-700 text-sm outline-none transition-all placeholder-slate-300">
                            </div>
                        </div>

                        <div class="space-y-5">
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Số điện thoại</label>
                                <input type="tel" name="phone" value="${user.phone || ''}"
                                    class="w-full px-5 py-3.5 bg-[#f8fafc] border-2 border-transparent focus:border-indigo-200 focus:bg-white rounded-2xl font-bold text-slate-700 text-sm outline-none transition-all placeholder-slate-300">
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Đổi mật khẩu</label>
                                <div class="relative">
                                    <input type="password" name="password" 
                                        class="w-full px-5 py-3.5 bg-[#f8fafc] border-2 border-transparent focus:border-indigo-200 focus:bg-white rounded-2xl font-bold text-slate-700 text-sm outline-none transition-all placeholder-slate-300" 
                                        placeholder="Nhập để đổi pass mới...">
                                    <div class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"><i data-lucide="lock" width="18"></i></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-10">
                        <button type="submit" id="btn-save-profile" class="w-full bg-[#5b61f1] hover:bg-[#4f46e5] text-white font-[900] py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] uppercase tracking-widest text-xs">
                            LƯU THAY ĐỔI
                        </button>
                    </div>
                </form>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
        if (window.lucide) lucide.createIcons();
    }
};