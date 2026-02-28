/**
 * js/controller/admin.controller.js
 * FINAL VERSION: Staff & Department Management (ES Module)
 * Đã bổ sung Custom Dropdown Logic & Full Avatar Display
 */
import staffService from '../service/admin/staff.service.js';
import deptService from '../service/admin/department.service.js';

class AdminController {
    constructor() {
        // Cache dữ liệu
        this.staffCache = [];
        this.deptCache = [];
        this.managersCache = [];

        // State quản lý thành viên trong Modal
        this.currentDeptMembers = [];
        this.availableUsers = [];

        // [QUAN TRỌNG] Expose ra window để HTML gọi được onclick="AdminController.xxx"
        window.AdminController = this;

        // Biến lưu trạng thái xóa (đang xóa cái gì, id bao nhiêu)
        this.pendingDeleteItem = null;
        this._injectDeleteModal();

        // Tự động chạy init
        this.init();
    }

    init() {
       const user = JSON.parse(localStorage.getItem('current_session_user') || '{}');
        const isManager = (user.role === 'MANAGER');

        // Tab Nhân sự
        if (document.getElementById('staff-list-container')) {
            this.loadDepartmentsToSelect().then(() => {
                this.loadStaffList();
            });
            this.loadRolesToSelect();
        }

        // Tab Phòng ban
        if (document.getElementById('department-list-container')) {
            // Nếu là Manager -> Ẩn nút thêm phòng ban
            const btnAdd = document.getElementById('btn-add-dept'); // Cần thêm ID này vào HTML bước 3
            if (btnAdd) {
                if (isManager) btnAdd.classList.add('hidden');
                else btnAdd.classList.remove('hidden');
            }
            this.loadDepartmentList();
        }
    }

    // ============================================================
    // 1. HELPER UI: CUSTOM DROPDOWN (DÙNG CHUNG)
    // ============================================================

    toggleDropdown(id) {
        const el = document.getElementById(id);
        // Đóng các dropdown khác đang mở
        document.querySelectorAll('[id$="-dropdown"]').forEach(d => {
            if (d.id !== id) d.classList.add('hidden');
        });

        if (el) {
            el.classList.toggle('hidden');
            // Xoay icon
            const icon = el.previousElementSibling.querySelector('[data-lucide="chevron-down"]');
            if (icon) icon.style.transform = el.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    }

    // Hàm chọn cho Staff Modal
    selectCustomOption(type, value, label) {
        const labelEl = document.getElementById(`label-${type}-selected`);
        const inputEl = document.getElementById(`staff-${type}-hidden-val`);
        const dropdown = document.getElementById(`${type}-dropdown`);

        if (labelEl) labelEl.innerText = label;
        if (inputEl) inputEl.value = value;
        if (dropdown) dropdown.classList.add('hidden');

        const icon = dropdown?.previousElementSibling?.querySelector('[data-lucide="chevron-down"]');
        if (icon) icon.style.transform = 'rotate(0deg)';
    }

    // [MỚI] Hàm chọn riêng cho Quản lý (Dept Modal) để xử lý logic check trùng
    selectDeptManager(value, label) {
        const labelEl = document.getElementById('label-manager-selected');
        const inputEl = document.getElementById('dept-manager-hidden-val');
        const dropdown = document.getElementById('manager-dropdown');

        if (labelEl) labelEl.innerText = label;
        if (inputEl) inputEl.value = value;
        if (dropdown) dropdown.classList.add('hidden');

        const icon = dropdown?.previousElementSibling?.querySelector('[data-lucide="chevron-down"]');
        if (icon) icon.style.transform = 'rotate(0deg)';

        // Kiểm tra trùng quản lý
        this.checkManagerConflict(value);
    }

    // ============================================================
    // 2. LOGIC MODAL PHÒNG BAN (ĐÃ CẬP NHẬT AVATAR)
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

        // Reset UI Cảnh báo
        document.getElementById('manager-warning')?.classList.add('hidden');
        document.getElementById('btn-manager-select')?.classList.remove('border-rose-500', 'bg-rose-50');

        // [MỚI] Ẩn nút Delete trong Modal nếu là Manager
        const btnDeleteInModal = document.getElementById('btn-delete-dept-modal'); // Cần thêm ID này vào HTML bước 4
        if(btnDeleteInModal) {
             if (isManager) btnDeleteInModal.classList.add('hidden');
             else btnDeleteInModal.classList.remove('hidden');
        }

        // 1. Tải danh sách Manager
        if (!isManager) {
            await this.loadManagersToSelect();
        }

        // 2. Tải User rảnh (Available) để thêm vào
        const resAvail = await staffService.getAvailableUsers();
        this.availableUsers = resAvail.status === 'success' ? resAvail.data : [];

        if (id) {
            // --- CHẾ ĐỘ SỬA ---
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
                    // Disable nút chọn
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
                        btnMgr.setAttribute('onclick', "AdminController.toggleDropdown('manager-dropdown')");
                    }
                }

                this.selectDeptManager(mgrId, mgrName);

                // Load thành viên
                const resMem = await staffService.getMembersByDept(id);
                this.currentDeptMembers = resMem.status === 'success' ? resMem.data : [];
            }
        } else {
            // --- CHẾ ĐỘ THÊM MỚI ---
            if (title) title.innerText = "THÊM PHÒNG BAN";
            if (idInput) idInput.value = '';

            // Reset Manager
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

    // Render danh sách Manager vào Custom Dropdown
    async loadManagersToSelect() {
        const list = document.getElementById('list-manager-options');
        if (!list) return;

        const res = await staffService.getManagers();
        if (res.status === 'success') {
            this.managersCache = res.data;

            let html = `<div class="p-3 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-50 cursor-pointer transition-all" 
                        onclick="AdminController.selectDeptManager('', '-- Chọn quản lý --')">-- Bỏ chọn --</div>`;

            res.data.forEach(m => {
                html += `<div class="p-3 rounded-xl text-xs font-[800] text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-all flex justify-between items-center" 
                        onclick="AdminController.selectDeptManager('${m.id}', '${m.fullName}')">
                            <span>${m.fullName}</span>
                            <span class="text-[9px] text-slate-300 font-normal">@${m.username}</span>
                        </div>`;
            });
            list.innerHTML = html;
        }
    }

    // Logic kiểm tra trùng quản lý
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

        // Conflict nếu đang quản lý phòng khác (và không phải phòng hiện tại)
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
        const memberIds = this.currentDeptMembers.map(u => u.id);

        const data = {
            id: form.id.value,
            name: form.name.value.trim(),
            description: form.description.value.trim(),
            // [FIX] Lấy từ hidden input thay vì select box
            manager_id: document.getElementById('dept-manager-hidden-val').value,
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
                this.loadStaffList(); // Reload staff list để cập nhật role manager
                this.loadDepartmentsToSelect();
            } else {
                alert('Lỗi: ' + res.message);
            }
        } catch (e) {
            alert('Lỗi kết nối Server');
        } finally {
            this._toggleBtnLoading('btn-save-dept', false, 'LƯU THAY ĐỔI');
        }
    }

    deleteDept(id, name) {
        this.openDeleteModal('dept', id, name);
    }

    // ============================================================
    // 3. LOGIC STAFF (ĐÃ CẬP NHẬT HIỂN THỊ AVATAR ĐỒNG BỘ)
    // ============================================================

    async loadStaffList() {
        const container = document.getElementById('staff-list-container');
        if (!container) return;
        this._renderLoading(container);
        const res = await staffService.getAll();
        if (res.status === 'success' && Array.isArray(res.data)) {
            this.staffCache = res.data;
            this.renderStaffList(res.data);
        } else {
            this._renderError(container);
        }
    }

    renderStaffList(staffMembers) {
        const container = document.getElementById('staff-list-container');
        if (!container) return;
        if (staffMembers.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center text-slate-400 italic">Chưa có nhân sự nào.</div>';
            return;
        }
        let html = '';
        staffMembers.forEach(member => {
            const isActive = member.active == 1;
            const statusClass = isActive ? 'bg-[#dcfce7] text-[#166534]' : 'bg-slate-100 text-slate-400';
            const statusText = isActive ? 'ĐANG HOẠT ĐỘNG' : 'TẠM KHÓA';
            const roleDisplay = member.role_name ? member.role_name.toUpperCase() : (member.role || 'MEMBER');
            let deptDisplay = member.dept_name;
            if (!deptDisplay && member.department && member.department != 0) {
                const dept = this.deptCache.find(d => d.id == member.department);
                deptDisplay = dept ? dept.name : 'ID: ' + member.department;
            }
            if (!deptDisplay || deptDisplay == '0' || member.department == 0) {
                deptDisplay = 'CHƯA PHÂN PHÒNG';
            } else {
                deptDisplay = deptDisplay.toUpperCase();
            }

            const avatarSrc = member.avatar
                ? member.avatar
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=random&size=128`;

            html += `
            <div class="bg-white rounded-[32px] p-8 border border-slate-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                <div class="flex items-start gap-5 mb-8">
                    <img src="${avatarSrc}" class="w-16 h-16 rounded-[24px] object-cover border border-slate-100 shrink-0 shadow-sm bg-slate-50">
                    
                    <div class="pt-1">
                        <h3 class="font-[900] text-[17px] text-slate-900 leading-tight mb-1.5 line-clamp-1">${member.fullName}</h3>
                        <div class="flex items-center gap-2 text-[10px] font-black tracking-widest">
                             <span class="text-indigo-600 whitespace-nowrap">${deptDisplay}</span>
                             <span class="text-slate-300">•</span>
                             <span class="text-slate-400">${roleDisplay}</span>
                        </div>
                    </div>
                </div>
                <div class="space-y-3 mb-8 flex-1 pl-1">
                    <div class="flex items-center gap-3 text-[13px] font-bold text-slate-500"><i data-lucide="mail" width="16" class="text-slate-300 shrink-0"></i><span class="truncate">${member.email || 'N/A'}</span></div>
                    <div class="flex items-center gap-3 text-[13px] font-bold text-slate-500"><i data-lucide="phone" width="16" class="text-slate-300 shrink-0"></i><span>${member.phone || 'N/A'}</span></div>
                </div>
                <div class="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto">
                    <span class="px-4 py-2 rounded-xl text-[9px] font-[900] uppercase tracking-widest ${statusClass}">${statusText}</span>
                    <div class="flex gap-2">
                         <button onclick="AdminController.openStaffModal(${member.id})" class="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all"><i data-lucide="edit-3" width="18"></i></button>
                         ${member.id != 1 ? `<button onclick="AdminController.deleteStaff(${member.id})" class="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all"><i data-lucide="trash-2" width="18"></i></button>` : ''}
                    </div>
                </div>
            </div>`;
        });
        container.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    }

    async saveStaff(event) {
        event.preventDefault();
        const form = event.target;
        const data = {
            id: form.id.value,
            fullName: form.fullName.value.trim(),
            username: form.username.value.trim(),
            password: form.password.value.trim(),
            email: form.email.value.trim(),
            phone: form.phone.value.trim(),
            role: form.role.value,
            department: form.department.value,
            active: form.active.checked ? 1 : 0
        };
        if (!data.fullName || !data.username) return window.Utils.showToast('Vui lòng điền tên và tài khoản', 'error');
        this._toggleBtnLoading('btn-save-staff', true, 'ĐANG XỬ LÝ...');
        try {
            const res = data.id ? await staffService.update(data) : await staffService.create(data);
            if (res.status === 'success') {
                if (window.Utils) window.Utils.showToast(data.id ? 'Đã cập nhật!' : 'Đã thêm mới!', 'success');
                this.closeModal();
                await this.loadStaffList();
            } else {
                alert('Lỗi: ' + res.message);
            }
        } catch (e) { alert('Lỗi kết nối Server'); }
        finally { this._toggleBtnLoading('btn-save-staff', false, data.id ? 'CẬP NHẬT' : 'LƯU THÔNG TIN'); }
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
            // [LOGIC MỚI] Ẩn nút xóa nếu là Manager
            const deleteBtn = isManager ? '' : `<button onclick="AdminController.deleteDept(${d.id}, '${d.name}')" class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all"><i data-lucide="trash-2" width="16"></i></button>`;

            html += `<div class="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full relative overflow-hidden"><div class="absolute -right-6 -top-6 w-24 h-24 bg-slate-50 rounded-full group-hover:bg-indigo-50 transition-colors duration-500"></div><div class="relative z-10"><div class="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"><i data-lucide="briefcase" width="24"></i></div><h3 class="font-[900] text-lg text-slate-800 uppercase tracking-tight mb-2">${d.name}</h3><p class="text-xs font-bold text-slate-400 mb-8 line-clamp-2 h-8">${d.description || '...'}</p><div class="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto"><div class="px-4 py-2 bg-[#eff6ff] text-indigo-600 rounded-xl text-[10px] font-[900] uppercase tracking-widest flex items-center gap-2"><i data-lucide="users" width="12"></i><span>${d.staff_count || 0} NHÂN VIÊN</span></div><div class="flex gap-2"><button onclick="AdminController.openDeptModal(${d.id})" class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all"><i data-lucide="edit-3" width="16"></i></button>${deleteBtn}</div></div></div></div>`;
        });
        container.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    }

    async loadDepartmentsToSelect() {
        const res = await deptService.getAll();
        if (res.status === 'success' && res.data) {
            this.deptCache = res.data;
            const list = document.getElementById('list-dept-options');
            if (!list) return;
            let html = `<div class="p-3 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-50 cursor-pointer" onclick="AdminController.selectCustomOption('dept', '', 'CHƯA PHÂN PHÒNG')">CHƯA PHÂN PHÒNG</div>`;
            res.data.forEach(d => {
                html += `<div class="p-3 rounded-xl text-xs font-[800] text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-all uppercase" onclick="AdminController.selectCustomOption('dept', '${d.id}', '${d.name}')">${d.name}</div>`;
            });
            list.innerHTML = html;
        }
    }

    async loadRolesToSelect() {
        const res = await staffService.getRoles();
        if (res.status === 'success' && res.data) {
            const list = document.getElementById('list-role-options');
            if (!list) return;
            let html = '';
            res.data.forEach(r => {
                const rName = (r.name || r.role_name).toUpperCase();
                html += `<div class="p-3 rounded-xl text-xs font-[800] text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-all" onclick="AdminController.selectCustomOption('role', '${r.code || r.id}', '${rName}')">${rName}</div>`;
            });
            list.innerHTML = html;
        }
    }

    // [FIXED] Render thành viên trong Modal Phòng ban (Có Avatar)
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
                <button onclick="AdminController.removeMemberFromDept(${u.id})" class="text-slate-300 hover:text-rose-500 p-1"><i data-lucide="minus-circle" width="16"></i></button>
            </div>`;
        });
        container.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    }

    // [FIXED] Render danh sách chọn thêm thành viên (Có Avatar)
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
                <div class="bg-white p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-sm cursor-pointer transition-all flex items-center justify-between group mb-2" onclick="AdminController.addMemberToDept(${u.id})">
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
    deleteStaff(id, name) { this.openDeleteModal('staff', id, name); }
    closeModal() { document.getElementById('staff-form-modal')?.classList.add('hidden'); }

    // [FIXED] Open Staff Modal with Avatar Check
    openStaffModal(id = null) {
        const modal = document.getElementById('staff-form-modal');
        const form = document.getElementById('staff-form');
        const idInput = document.getElementById('staff-id');
        const modalTitle = document.getElementById('modal-title');
        // [FIXED] Định nghĩa biến avatarPreview
        const avatarPreview = document.getElementById('staff-modal-avatar-preview');

        if (!modal || !form) return;
        form.reset();
        if (id) {
            modalTitle.innerText = "CẬP NHẬT NHÂN SỰ";
            const member = this.staffCache.find(u => u.id == id);
            if (member) {
                idInput.value = member.id;
                form.elements['fullName'].value = member.fullName;
                form.elements['username'].value = member.username;
                form.elements['email'].value = member.email || '';
                form.elements['phone'].value = member.phone || '';

                // Set Avatar Preview
                if (avatarPreview) {
                    avatarPreview.src = member.avatar
                        ? member.avatar
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=random&size=128`;
                }

                const dept = this.deptCache.find(d => d.id == member.department);
                this.selectCustomOption('dept', member.department || '', dept ? dept.name.toUpperCase() : 'CHƯA PHÂN PHÒNG');
                this.selectCustomOption('role', member.role, member.role_name ? member.role_name.toUpperCase() : 'NHÂN VIÊN');
                form.elements['active'].checked = (member.active == 1);
                form.elements['password'].placeholder = 'Để trống nếu không đổi';
            }
        } else {
            modalTitle.innerText = "THÊM NHÂN SỰ MỚI";
            idInput.value = '';

            // Reset Avatar Preview
            if (avatarPreview) avatarPreview.src = 'https://via.placeholder.com/128?text=USER';

            this.selectCustomOption('dept', '', '-- Chọn phòng ban --');
            this.selectCustomOption('role', 'STAFF', 'NHÂN VIÊN');
            form.elements['active'].checked = true;
            form.elements['password'].placeholder = '••••••';
        }
        modal.classList.remove('hidden');
    }

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
        if (document.getElementById('custom-delete-modal')) return;
        const modalHTML = `<div id="custom-delete-modal" class="fixed inset-0 z-[9999] hidden flex items-center justify-center transition-all duration-200 opacity-0 pointer-events-none"><div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onclick="AdminController.closeDeleteModal()"></div><div class="bg-white rounded-[24px] p-6 w-[90%] max-w-sm shadow-2xl relative z-10 transform scale-95 transition-all duration-200"><div class="flex flex-col items-center text-center"><div class="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4 shadow-sm shadow-rose-100"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><h3 class="text-lg font-[900] text-slate-800 mb-2 uppercase tracking-tight">Xác nhận xóa?</h3><p class="text-slate-500 text-xs font-medium mb-6 leading-relaxed">Bạn đang chuẩn bị xóa <span id="del-item-name" class="font-bold text-slate-800">mục này</span>.<br>Hành động này <span class="text-rose-500 font-bold">không thể hoàn tác</span>!</p><div class="flex gap-3 w-full"><button onclick="AdminController.closeDeleteModal()" class="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-[900] uppercase tracking-wider hover:bg-slate-200 transition-all">Hủy bỏ</button><button onclick="AdminController.executeDelete()" id="btn-confirm-delete" class="flex-1 py-3 rounded-xl bg-rose-500 text-white text-xs font-[900] uppercase tracking-wider hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all">Xóa ngay</button></div></div></div></div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    openDeleteModal(type, id, name = 'mục này') {
        this.pendingDeleteItem = { type, id };
        const modal = document.getElementById('custom-delete-modal');
        const nameEl = document.getElementById('del-item-name');
        if (modal && nameEl) {
            nameEl.innerText = type === 'staff' ? `nhân viên "${name}"` : `phòng ban "${name}"`;
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
        const modal = document.getElementById('custom-delete-modal');
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
        const btn = document.getElementById('btn-confirm-delete');
        const originalText = btn.innerText;
        btn.innerText = 'Đang xóa...';
        btn.disabled = true;
        let res;
        if (type === 'staff') { res = await staffService.delete(id); } else if (type === 'dept') { res = await deptService.delete(id); }
        btn.innerText = originalText;
        btn.disabled = false;
        this.closeDeleteModal();
        if (res && res.status === 'success') {
            window.Utils.showToast('Đã xóa thành công!', 'success');
            if (type === 'staff') this.loadStaffList(); else { this.loadDepartmentList(); this.loadDepartmentsToSelect(); }
        } else {
            window.Utils.showToast(res ? res.message : 'Lỗi không xác định', 'error');
        }
    }
}

new AdminController();