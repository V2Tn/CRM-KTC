// public_html/js/utils.js

const API_CONFIG = {
    URL: 'api.php'
};

window.Utils = {
    // 1. Hàm gọi API chuẩn (Unified)
    callApi: async (action, data = {}) => {
        try {
            const response = await fetch(API_CONFIG.URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ...data })
            });
            // Kiểm tra HTTP status
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const resData = await response.json();

            // [THÊM MỚI] Bắt lỗi mất Session từ Server và ép đăng xuất
            if (resData.status === 'unauthorized') {
                const sessionStr = localStorage.getItem('current_session_user');
            
                if (sessionStr) {
                    localStorage.removeItem('current_session_user');
                    if (window.Utils && window.Utils.showToast) {
                        window.Utils.showToast("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!", "error");
                    }
                    setTimeout(() => { window.location.reload(); }, 1500);
                }
                
                return { status: 'error', message: 'Hết phiên đăng nhập' };
            }

            return resData;
        } catch (error) {
            console.error("API Error:", error);
            return { status: 'error', message: 'Lỗi kết nối mạng hoặc JSON hỏng' };
        }
    },

    // 2. Hiệu ứng Loading cho nút bấm
    toggleLoading: (btnId, isLoading, text = '') => {
        const btn = document.getElementById(btnId);
        if (!btn) return;

        if (isLoading) {
            if (!btn.dataset.originalText) btn.dataset.originalText = btn.innerHTML;
            btn.innerHTML = `<i data-lucide="loader-2" class="animate-spin inline-block w-4 h-4 mr-2"></i> ${text}`;
            btn.disabled = true;
            btn.classList.add('opacity-70', 'cursor-not-allowed');
        } else {
            btn.innerHTML = btn.dataset.originalText || text;
            btn.disabled = false;
            btn.classList.remove('opacity-70', 'cursor-not-allowed');
        }
        if (window.lucide) lucide.createIcons();
    },

    // 3. HỆ THỐNG THÔNG BÁO TOAST
    showToast: (message, type = 'success') => {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');

        // Bảng cấu hình Màu sắc và Icon tương ứng với từng type
        let colors = {};
        let iconSvg = '';

        if (type === 'success') {
            colors = { border: '#10b981', bg: '#ecfdf5', text: '#065f46' }; // Xanh lá
            iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${colors.border}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01l-3-3"/></svg>`;
        } else if (type === 'error') {
            colors = { border: '#ef4444', bg: '#fef2f2', text: '#991b1b' }; // Đỏ
            iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${colors.border}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`;
        } else if (type === 'info') {
            colors = { border: '#3b82f6', bg: '#eff6ff', text: '#1e3a8a' }; // Xanh dương
            iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${colors.border}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
        } else {
            // Mặc định (Nếu truyền sai type)
            colors = { border: '#64748b', bg: '#f8fafc', text: '#334155' }; // Xám
            iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${colors.border}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="16"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>`;
        }

        toast.style.cssText = `
            background: white; border-left: 4px solid ${colors.border}; 
            padding: 16px 20px; border-radius: 12px; 
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); 
            display: flex; align-items: center; gap: 12px;
            font-family: 'Lexend', sans-serif; font-size: 13px; font-weight: 600; color: #334155;
            min-width: 300px; transform: translateX(120%); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        `;

        toast.innerHTML = `<div>${iconSvg}</div><span>${message}</span>`;
        container.appendChild(toast);

        requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });

        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    },

    // Wrapper (để tương thích ngược nếu có chỗ gọi Utils.toast)
    toast: (msg) => window.Utils.showToast(msg),

    // ==========================================
    // CÁC HÀM DÙNG CHUNG TOÀN HỆ THỐNG
    // ==========================================

    /**
     * 4. Rút gọn tên 
     */
    formatShortName: (fullName) => {
        if (!fullName) return 'User';
        const parts = fullName.trim().split(' ');
        // Lấy 2 chữ cuối cùng của tên
        return parts.length > 2 ? parts.slice(-2).join(' ') : fullName;
    },

    /**
     * 5. Lấy Avatar có dự phòng ảnh chữ cái đầu (UI-Avatars)
     */
    getAvatar: (avatarUrl, fullName, size = 64) => {
        // Nếu user đã có ảnh đại diện -> Trả về ảnh đó
        if (avatarUrl && avatarUrl.trim() !== '') {
            return avatarUrl;
        }
        // Nếu không có ảnh -> Tạo ảnh bằng 2 chữ cái đầu của Tên
        const shortName = window.Utils.formatShortName(fullName);
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(shortName)}&background=random&size=${size}&bold=true`;
    },

    /**
     * 6. Đóng/Mở Custom Dropdown
     */
    toggleDropdown: (id) => {
        const el = document.getElementById(id);
        if (!el) return;

        // Đóng các dropdown khác đang mở
        document.querySelectorAll('.custom-dropdown-menu').forEach(d => {
            if (d.id !== id) {
                d.classList.add('hidden');
                const icon = d.previousElementSibling?.querySelector('[data-lucide="chevron-down"]');
                if (icon) icon.style.transform = 'rotate(0deg)';
            }
        });

        el.classList.toggle('hidden');
        const icon = el.previousElementSibling?.querySelector('[data-lucide="chevron-down"]');
        if (icon) {
            icon.style.transform = el.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    },

    /**
     * 7. Chọn Option trong Custom Dropdown
     */
    selectCustomOption: (dropdownId, inputId, labelId, value, labelText, extraCallback = null) => {
        document.getElementById(inputId).value = value;
        document.getElementById(labelId).innerText = labelText;
        window.Utils.toggleDropdown(dropdownId);

        // Chạy hàm bổ sung nếu có
        if (extraCallback && typeof extraCallback === 'function') {
            extraCallback(value);
        }
    },

    // ==========================================
    // LOGIC MODAL XÓA DÙNG CHUNG
    // ==========================================
    deleteCallback: null,

    _injectDeleteModal: () => {
        if (document.getElementById('custom-delete-modal')) return;
        const modalHTML = `
        <div id="custom-delete-modal" class="fixed inset-0 z-[9999] hidden flex items-center justify-center transition-all duration-200 opacity-0 pointer-events-none">
            <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onclick="Utils.closeDeleteModal()"></div>
            <div class="bg-white rounded-[24px] p-6 w-[90%] max-w-sm shadow-2xl relative z-10 transform scale-95 transition-all duration-200">
                <div class="flex flex-col items-center text-center">
                    <div class="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4 shadow-sm shadow-rose-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <h3 class="text-lg font-[900] text-slate-800 mb-2 uppercase tracking-tight">Xác nhận xóa?</h3>
                    <p class="text-slate-500 text-xs font-medium mb-6 leading-relaxed">Bạn đang chuẩn bị xóa <span id="del-item-name" class="font-bold text-slate-800">mục này</span>.<br>Hành động này <span class="text-rose-500 font-bold">không thể hoàn tác</span>!</p>
                    <div class="flex gap-3 w-full">
                        <button onclick="Utils.closeDeleteModal()" class="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-[900] uppercase tracking-wider hover:bg-slate-200 transition-all">Hủy bỏ</button>
                        <button onclick="Utils.executeDelete()" id="btn-confirm-delete" class="flex-1 py-3 rounded-xl bg-rose-500 text-white text-xs font-[900] uppercase tracking-wider hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all">Xóa ngay</button>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    openDeleteModal: (itemName, confirmCallback) => {
        document.getElementById('del-item-name').innerText = itemName;
        window.Utils.deleteCallback = confirmCallback;

        const modal = document.getElementById('custom-delete-modal');
        modal.classList.remove('hidden', 'pointer-events-none');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('div.transform').classList.remove('scale-95');
            modal.querySelector('div.transform').classList.add('scale-100');
        }, 10);
    },

    closeDeleteModal: () => {
        window.Utils.deleteCallback = null;
        const modal = document.getElementById('custom-delete-modal');
        if (modal) {
            modal.classList.add('opacity-0');
            modal.querySelector('div.transform').classList.remove('scale-100');
            modal.querySelector('div.transform').classList.add('scale-95');
            setTimeout(() => modal.classList.add('hidden', 'pointer-events-none'), 200);
        }
    },

    executeDelete: async () => {
        if (!window.Utils.deleteCallback) return;
        const btn = document.getElementById('btn-confirm-delete');
        const originalText = btn.innerText;
        btn.innerText = 'Đang xóa...';
        btn.disabled = true;

        await window.Utils.deleteCallback(); // Chạy hàm xóa được truyền vào

        btn.innerText = originalText;
        btn.disabled = false;
        window.Utils.closeDeleteModal();
    }
};

// Tự động chèn Modal Xóa vào giao diện khi trang load xong
document.addEventListener('DOMContentLoaded', () => {
    if (window.Utils && window.Utils._injectDeleteModal) {
        window.Utils._injectDeleteModal();
    }
});