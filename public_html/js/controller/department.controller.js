/**
 * js/controller/department.controller.js
 * Quản lý Phòng ban (Được tách nguyên bản từ AdminController)
 */
import staffService from '../service/admin/staff.service.js';
import deptService from '../service/admin/department.service.js';

class DepartmentController {
    constructor() {
        // Cache dữ liệu
        this.deptCache = [];
        this.managersCache = [];

        // State quản lý thành viên trong Modal
        this.currentDeptMembers = [];
        this.availableUsers = [];

        // Expose ra window để HTML gọi được
        window.DepartmentController = this;

        // Biến lưu trạng thái xóa
        this.pendingDeleteItem = null;
        this._injectDeleteModal();

        this.pendingManagerChange = null;
        this._injectManagerChangeModal();

        // Tự động chạy init
        this.init();
    }

    init() {
        const user = JSON.parse(localStorage.getItem('current_session_user') || '{}');
        const isManager = (user.role === 'MANAGER');

        // Tab Phòng ban
        if (document.getElementById('department-list-container')) {
            // Nếu là Manager -> Ẩn nút thêm phòng ban
            const btnAdd = document.getElementById('btn-add-dept');
            if (btnAdd) {
                if (isManager) btnAdd.classList.add('hidden');
                else btnAdd.classList.remove('hidden');
            }
            this.loadDepartmentList();
        }
    }

    // ============================================================
    // HELPER UI
    // ============================================================
    toggleDropdown(id) {
        const el = document.getElementById(id);
        document.querySelectorAll('[id$="-dropdown"]').forEach(d => {
            if (d.id !== id) d.classList.add('hidden');
        });

        if (el) {
            el.classList.toggle('hidden');
            const icon = el.previousElementSibling.querySelector('[data-lucide="chevron-down"]');
            if (icon) icon.style.transform = el.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    }

    // Hàm chọn riêng cho Quản lý
    selectDeptManager(value, label) {
        const labelEl = document.getElementById('label-manager-selected');
        const inputEl = document.getElementById('dept-manager-hidden-val');
        const dropdown = document.getElementById('manager-dropdown');

        if (labelEl) labelEl.innerText = label;
        if (inputEl) inputEl.value = value;
        if (dropdown) dropdown.classList.add('hidden');

        const icon = dropdown?.previousElementSibling?.querySelector('[data-lucide="chevron-down"]');
        if (icon) icon.style.transform = 'rotate(0deg)';

        this.checkManagerConflict(value);
        if (value) {
            const isMember = this.currentDeptMembers.some(u => u.id == value);
            if (!isMember) {
                const managerData = this.managersCache.find(m => m.id == value);
                if (managerData) {
                    this.currentDeptMembers.push(managerData);
                    this.renderCurrentMembers();
                    this.availableUsers = this.availableUsers.filter(u => u.id != value);
                    this.renderAvailableMembers();
                }
            }
        }
    }

    handleManagerSelection(newId, newName) {
        const currentSelectedId = document.getElementById('dept-manager-hidden-val').value;
        const currentSelectedName = document.getElementById('label-manager-selected').innerText;

        // Đóng dropdown trước cho gọn màn hình
        document.getElementById('manager-dropdown')?.classList.add('hidden');
        const icon = document.getElementById('manager-dropdown')?.previousElementSibling?.querySelector('[data-lucide="chevron-down"]');
        if (icon) icon.style.transform = 'rotate(0deg)';

        // NẾU ĐÃ CÓ QUẢN LÝ VÀ CHỌN MỘT NGƯỜI KHÁC -> BẬT CẢNH BÁO
        if (currentSelectedId && currentSelectedId !== newId && newId !== '') {
            this.pendingManagerChange = { id: newId, name: newName };
            document.getElementById('current-manager-name').innerText = currentSelectedName;
            document.getElementById('new-manager-name').innerText = newName;

            const modal = document.getElementById('manager-change-modal');
            modal.classList.remove('hidden', 'pointer-events-none');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modal.querySelector('div.transform').classList.remove('scale-95');
                modal.querySelector('div.transform').classList.add('scale-100');
                if (window.lucide) lucide.createIcons();
            }, 10);
        } else {
            // NẾU PHÒNG TRỐNG (CHƯA CÓ QUẢN LÝ) THÌ CỨ CHO CHỌN BÌNH THƯỜNG
            this.selectDeptManager(newId, newName);
        }
    }

    cancelManagerChange() {
        this.pendingManagerChange = null;
        const modal = document.getElementById('manager-change-modal');
        if (modal) {
            modal.classList.add('opacity-0');
            modal.querySelector('div.transform').classList.remove('scale-100');
            modal.querySelector('div.transform').classList.add('scale-95');
            setTimeout(() => modal.classList.add('hidden', 'pointer-events-none'), 200);
        }
    }

    confirmManagerChange() {
        if (this.pendingManagerChange) {
            // Gọi lại hàm chọn cũ -> Đổi sếp, cập nhật UI, tự động thêm sếp mới vào danh sách thành viên
            this.selectDeptManager(this.pendingManagerChange.id, this.pendingManagerChange.name);
        }
        this.cancelManagerChange();
    }

    // ============================================================
    // LOGIC PHÒNG BAN
    // ============================================================
    async openDeptModal(id = null) {
        const modal = document.getElementById('dept-form-modal');
        const form = document.getElementById('dept-form');
        const idInput = document.getElementById('dept-id');
        const title = document.getElementById('dept-modal-title');

        const user = JSON.parse(localStorage.getItem('current_session_user') || '{}');
        const isManager = (user.role === 'MANAGER');

        if (!modal || !form) return;
        form.reset();

        document.getElementById('manager-warning')?.classList.add('hidden');
        document.getElementById('btn-manager-select')?.classList.remove('border-rose-500', 'bg-rose-50');

        const btnDeleteInModal = document.getElementById('btn-delete-dept-modal');
        if (btnDeleteInModal) {
            if (isManager) btnDeleteInModal.classList.add('hidden');
            else btnDeleteInModal.classList.remove('hidden');
        }

        if (!isManager) {
            await this.loadManagersToSelect();
        }

        const resAvail = await staffService.getAvailableUsers();
        this.availableUsers = resAvail.status === 'success' ? resAvail.data : [];

        if (id) {
            const dept = this.deptCache.find(d => d.id == id);
            if (dept) {
                if (title) title.innerText = dept.name;
                if (idInput) idInput.value = dept.id;

                if (form.elements['name']) form.elements['name'].value = dept.name;
                if (form.elements['description']) form.elements['description'].value = dept.description || '';

                const mgrId = dept.managerId || '';
                let mgrName = '-- Chọn quản lý --';

                if (isManager) {
                    mgrName = user.fullName + " (Tôi)";
                    const btnMgr = document.getElementById('btn-manager-select');
                    if (btnMgr) {
                        btnMgr.classList.add('pointer-events-none', 'opacity-60', 'bg-slate-100');
                        btnMgr.onclick = null;
                    }
                } else {
                    if (mgrId) {
                        const m = this.managersCache.find(u => u.id == mgrId);
                        if (m) mgrName = m.fullName;
                    }
                    const btnMgr = document.getElementById('btn-manager-select');
                    if (btnMgr) {
                        btnMgr.classList.remove('pointer-events-none', 'opacity-60', 'bg-slate-100');
                        btnMgr.setAttribute('onclick', "DepartmentController.toggleDropdown('manager-dropdown')");
                    }
                }

                this.selectDeptManager(mgrId, mgrName);

                const resMem = await staffService.getMembersByDept(id);
                this.currentDeptMembers = resMem.status === 'success' ? resMem.data : [];
            }
        } else {
            if (title) title.innerText = "THÊM PHÒNG BAN";
            if (idInput) idInput.value = '';

            this.selectDeptManager('', '-- Chọn quản lý --');
            this.currentDeptMembers = [];
        }

        this.renderCurrentMembers();
        this.renderAvailableMembers();
        this.toggleAddMemberView(false);
        modal.classList.remove('hidden');
    }

    closeDeptModal() {
        document.getElementById('dept-form-modal')?.classList.add('hidden');
    }

    async loadManagersToSelect() {
        const list = document.getElementById('list-manager-options');
        if (!list) return;

        const res = await staffService.getManagers();
        if (res.status === 'success') {
            this.managersCache = res.data;
            let html = `<div class="p-3 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-50 cursor-pointer transition-all" 
                        onclick="DepartmentController.handleManagerSelection('', '-- Chọn quản lý --')">-- Bỏ chọn --</div>`;

            res.data.forEach(m => {
                html += `<div class="p-3 rounded-xl text-xs font-[800] text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-all flex justify-between items-center" 
                        onclick="DepartmentController.handleManagerSelection('${m.id}', '${m.fullName}')">
                            <span>${m.fullName}</span>
                            <span class="text-[9px] text-slate-300 font-normal">@${m.username}</span>
                        </div>`;
            });
            list.innerHTML = html;
        }
    }

    checkManagerConflict(selectedId) {
        const btn = document.getElementById('btn-manager-select');
        const warning = document.getElementById('manager-warning');
        const warningText = document.getElementById('manager-warning-text');
        const currentDeptId = document.getElementById('dept-id').value;

        if (!btn || !warning) return;

        if (!selectedId) {
            warning.classList.add('hidden');
            btn.classList.remove('border-rose-500', 'bg-rose-50');
            return;
        }

        const manager = this.managersCache.find(m => m.id == selectedId);

        if (manager && manager.current_dept_id && manager.current_dept_id != currentDeptId) {
            warningText.innerText = `${manager.username} đang quản lý ${manager.current_dept_name}`;
            warning.classList.remove('hidden');

            window.Utils.showToast(`Cảnh báo: ${manager.fullName} đang quản lý phòng khác!`, 'error');
            btn.classList.add('border-rose-500', 'bg-rose-50');
        } else {
            warning.classList.add('hidden');
            btn.classList.remove('border-rose-500', 'bg-rose-50');
        }
    }

    async saveDept(event) {
        event.preventDefault();
        const form = event.target;
        const managerId = document.getElementById('dept-manager-hidden-val').value;
        let memberIds = this.currentDeptMembers.map(u => u.id);

        if (managerId && !memberIds.some(id => id == managerId)) {
            memberIds.push(managerId);
        }

        const data = {
            id: form.id.value,
            name: form.name.value.trim(),
            description: form.description.value.trim(),
            manager_id: managerId,
            members: memberIds
        };

        if (!data.name) return window.Utils.showToast('Vui lòng nhập tên phòng ban', 'error');

        this._toggleBtnLoading('btn-save-dept', true, 'ĐANG LƯU...');

        try {
            const res = data.id
                ? await deptService.update(data)
                : await deptService.create(data);

            if (res.status === 'success') {
                if (window.Utils) window.Utils.showToast(data.id ? 'Đã cập nhật!' : 'Thêm thành công!', 'success');
                this.closeDeptModal();
                this.loadDepartmentList();
                if (window.StaffController) {
                    window.StaffController.loadStaffList();
                    window.StaffController.loadDepartmentsToSelect();
                }
            } else {
                alert('Lỗi: ' + res.message);
            }
        } catch (e) {
            alert('Lỗi kết nối Server');
        } finally {
            this._toggleBtnLoading('btn-save-dept', false, 'LƯU THAY ĐỔI');
        }
    }

    async loadDepartmentList() {
        const container = document.getElementById('department-list-container');
        if (!container) return;
        this._renderLoading(container);
        const res = await deptService.getAll();
        if (res.status === 'success') {
            this.deptCache = res.data;
            this.renderDepartmentList(res.data);
        } else {
            this._renderError(container);
        }
    }

    renderDepartmentList(departments) {
        const container = document.getElementById('department-list-container');
        if (!container) return;

        const user = JSON.parse(localStorage.getItem('current_session_user') || '{}');
        const isManager = (user.role === 'MANAGER');

        if (departments.length === 0) { container.innerHTML = '<div class="col-span-full text-center text-slate-400 italic">Chưa có phòng ban nào.</div>'; return; }

        let html = '';
        departments.forEach(d => {
            const deleteBtn = isManager ? '' : `<button onclick="DepartmentController.deleteDept(${d.id}, '${d.name}')" class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all"><i data-lucide="trash-2" width="16"></i></button>`;

            html += `<div class="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full relative overflow-hidden"><div class="absolute -right-6 -top-6 w-24 h-24 bg-slate-50 rounded-full group-hover:bg-indigo-50 transition-colors duration-500"></div><div class="relative z-10"><div class="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"><i data-lucide="briefcase" width="24"></i></div><h3 class="font-[900] text-lg text-slate-800 uppercase tracking-tight mb-2">${d.name}</h3><p class="text-xs font-bold text-slate-400 mb-8 line-clamp-2 h-8">${d.description || '...'}</p><div class="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto"><div class="px-4 py-2 bg-[#eff6ff] text-indigo-600 rounded-xl text-[10px] font-[900] uppercase tracking-widest flex items-center gap-2"><i data-lucide="users" width="12"></i><span>${d.staff_count || 0} NHÂN VIÊN</span></div><div class="flex gap-2"><button onclick="DepartmentController.openDeptModal(${d.id})" class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all"><i data-lucide="edit-3" width="16"></i></button>${deleteBtn}</div></div></div></div>`;
        });
        container.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    }

    renderCurrentMembers() {
        const container = document.getElementById('current-members-list');
        const countLabel = document.getElementById('member-count');
        if (!container) return;
        countLabel.innerText = this.currentDeptMembers.length;
        if (this.currentDeptMembers.length === 0) { container.innerHTML = '<div class="text-center text-slate-300 text-xs py-10 italic">Chưa có thành viên nào</div>'; return; }
        let html = '';
        this.currentDeptMembers.forEach(u => {
            const avatarSrc = u.avatar ? u.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName)}&background=random&size=64`;

            html += `
            <div class="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between group shadow-sm">
                <div class="flex items-center gap-3">
                    <img src="${avatarSrc}" class="w-8 h-8 rounded-lg object-cover border border-slate-100 shadow-sm">
                    <div><p class="text-xs font-bold text-slate-700">${u.fullName}</p></div>
                </div>
                <button type="button" onclick="DepartmentController.removeMemberFromDept(${u.id})" class="text-slate-300 hover:text-rose-500 p-1"><i data-lucide="minus-circle" width="16"></i></button>
            </div>`;
        });
        container.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    }

    renderAvailableMembers() {
        const container = document.getElementById('available-members-list');
        const searchVal = document.getElementById('search-member-input')?.value.toLowerCase() || '';
        const currentIds = this.currentDeptMembers.map(u => u.id);
        const filtered = this.availableUsers.filter(u => u.fullName.toLowerCase().includes(searchVal) && !currentIds.includes(u.id));
        let html = '';
        if (filtered.length === 0) { html = '<div class="text-center text-slate-300 text-xs py-10">Không tìm thấy nhân viên phù hợp</div>'; } else {
            filtered.forEach(u => {
                const deptBadge = u.current_dept_name ? `<span class="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">${u.current_dept_name}</span>` : `<span class="text-[9px] text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded ml-1">Tự do</span>`;
                const avatarSrc = u.avatar ? u.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName)}&background=random&size=64`;

                html += `
                <div class="bg-white p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-sm cursor-pointer transition-all flex items-center justify-between group mb-2" onclick="DepartmentController.addMemberToDept(${u.id})">
                    <div class="flex items-center gap-3 overflow-hidden">
                        <img src="${avatarSrc}" class="w-8 h-8 rounded-full object-cover border border-slate-100 shrink-0">
                        <div class="truncate">
                            <p class="text-xs font-bold text-slate-700 group-hover:text-indigo-700 transition-colors truncate">${u.fullName}</p>
                            <div class="flex items-center gap-1">${deptBadge}</div>
                        </div>
                    </div>
                    <div class="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-500 group-hover:text-white transition-all"><i data-lucide="plus" width="14"></i></div>
                </div>`;
            });
        }
        container.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    }

    addMemberToDept(userId) {
        const idx = this.availableUsers.findIndex(u => u.id == userId);
        if (idx > -1) {
            this.currentDeptMembers.push(this.availableUsers[idx]);
            this.availableUsers.splice(idx, 1);
            this.renderCurrentMembers();
            this.renderAvailableMembers();
        }
    }

    removeMemberFromDept(userId) {
        const idx = this.currentDeptMembers.findIndex(u => u.id == userId);
        if (idx > -1) {
            this.availableUsers.push(this.currentDeptMembers[idx]);
            this.currentDeptMembers.splice(idx, 1);
            this.renderCurrentMembers();
            this.renderAvailableMembers();
        }
    }

    toggleAddMemberView(show) {
        const overlay = document.getElementById('add-member-overlay');
        if (show) overlay.classList.remove('translate-x-full'); else overlay.classList.add('translate-x-full');
    }

    filterAvailableMembers() { this.renderAvailableMembers(); }
    deleteDept(id, name) { this.openDeleteModal('dept', id, name); }

    // Helpers
    _renderLoading(container) {
        container.innerHTML = '<div class="col-span-full py-20 flex flex-col items-center justify-center text-slate-300"><i data-lucide="loader-2" width="32" class="animate-spin mb-2"></i><span class="text-xs font-bold uppercase">Đang tải dữ liệu...</span></div>';
        if (window.lucide) lucide.createIcons();
    }
    _renderError(container) {
        container.innerHTML = '<div class="col-span-full text-center text-rose-500 font-bold">Lỗi tải dữ liệu.</div>';
    }
    _toggleBtnLoading(btnId, isLoading, text) {
        if (window.Utils) window.Utils.toggleLoading(btnId, isLoading, text);
    }

    // Modal Delete
    _injectDeleteModal() {
        if (document.getElementById('dept-delete-modal')) return;
        const modalHTML = `<div id="dept-delete-modal" class="fixed inset-0 z-[9999] hidden flex items-center justify-center transition-all duration-200 opacity-0 pointer-events-none"><div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onclick="DepartmentController.closeDeleteModal()"></div><div class="bg-white rounded-[24px] p-6 w-[90%] max-w-sm shadow-2xl relative z-10 transform scale-95 transition-all duration-200"><div class="flex flex-col items-center text-center"><div class="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4 shadow-sm shadow-rose-100"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><h3 class="text-lg font-[900] text-slate-800 mb-2 uppercase tracking-tight">Xác nhận xóa?</h3><p class="text-slate-500 text-xs font-medium mb-6 leading-relaxed">Bạn đang chuẩn bị xóa <span id="dept-del-item-name" class="font-bold text-slate-800">mục này</span>.<br>Hành động này <span class="text-rose-500 font-bold">không thể hoàn tác</span>!</p><div class="flex gap-3 w-full"><button onclick="DepartmentController.closeDeleteModal()" class="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-[900] uppercase tracking-wider hover:bg-slate-200 transition-all">Hủy bỏ</button><button onclick="DepartmentController.executeDelete()" id="dept-btn-confirm-delete" class="flex-1 py-3 rounded-xl bg-rose-500 text-white text-xs font-[900] uppercase tracking-wider hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all">Xóa ngay</button></div></div></div></div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    openDeleteModal(type, id, name = 'mục này') {
        this.pendingDeleteItem = { type, id };
        const modal = document.getElementById('dept-delete-modal');
        const nameEl = document.getElementById('dept-del-item-name');
        if (modal && nameEl) {
            nameEl.innerText = `phòng ban "${name}"`;
            modal.classList.remove('hidden', 'pointer-events-none');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modal.querySelector('div.transform').classList.remove('scale-95');
                modal.querySelector('div.transform').classList.add('scale-100');
            }, 10);
        }
    }

    closeDeleteModal() {
        this.pendingDeleteItem = null;
        const modal = document.getElementById('dept-delete-modal');
        if (modal) {
            modal.classList.add('opacity-0');
            modal.querySelector('div.transform').classList.remove('scale-100');
            modal.querySelector('div.transform').classList.add('scale-95');
            setTimeout(() => modal.classList.add('hidden', 'pointer-events-none'), 200);
        }
    }

    async executeDelete() {
        if (!this.pendingDeleteItem) return;
        const { type, id } = this.pendingDeleteItem;
        const btn = document.getElementById('dept-btn-confirm-delete');
        const originalText = btn.innerText;
        btn.innerText = 'Đang xóa...';
        btn.disabled = true;
        let res;
        if (type === 'dept') { res = await deptService.delete(id); }
        btn.innerText = originalText;
        btn.disabled = false;
        this.closeDeleteModal();
        if (res && res.status === 'success') {
            window.Utils.showToast('Đã xóa thành công!', 'success');
            this.loadDepartmentList();

            if (window.StaffController) {
                window.StaffController.loadDepartmentsToSelect();
            }
        } else {
            window.Utils.showToast(res ? res.message : 'Lỗi không xác định', 'error');
        }
    }

    // ============================================================
    // MODAL CẢNH BÁO THAY ĐỔI QUẢN LÝ
    // ============================================================
    _injectManagerChangeModal() {
        if (document.getElementById('manager-change-modal')) return;
        const modalHTML = `
        <div id="manager-change-modal" class="fixed inset-0 z-[10005] hidden flex items-center justify-center transition-all duration-200 opacity-0 pointer-events-none">
            <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onclick="DepartmentController.cancelManagerChange()"></div>
            <div class="bg-white rounded-[24px] p-6 w-[90%] max-w-sm shadow-2xl relative z-10 transform scale-95 transition-all duration-200">
                <div class="flex flex-col items-center text-center">
                    <div class="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-4 shadow-sm shadow-amber-100">
                        <i data-lucide="alert-triangle" width="28"></i>
                    </div>
                    <h3 class="text-lg font-[900] text-slate-800 mb-2 uppercase tracking-tight">Thay đổi Quản lý?</h3>
                    <p class="text-slate-500 text-xs font-medium mb-6 leading-relaxed">
                        Phòng ban này đang được quản lý bởi <span id="current-manager-name" class="font-black text-slate-800 uppercase">...</span>.<br>
                        Bạn có chắc chắn muốn chuyển quyền cho <span id="new-manager-name" class="font-black text-indigo-600 uppercase">...</span> không?
                    </p>
                    <div class="flex gap-3 w-full">
                        <button onclick="DepartmentController.cancelManagerChange()" class="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-[900] uppercase tracking-wider hover:bg-slate-200 transition-all">Hủy bỏ</button>
                        <button onclick="DepartmentController.confirmManagerChange()" class="flex-1 py-3 rounded-xl bg-amber-500 text-white text-[10px] font-[900] uppercase tracking-wider hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all">Đổi quản lý</button>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
}

new DepartmentController();