/**
 * controller/staff.js
 * Quản lý Nhân sự (Được tách nguyên bản từ AdminController)
 */
import staffService from "../service/admin/staff-min.js";
import deptService from "../service/admin/department-min.js";

class StaffController {
  constructor() {
    // Cache dữ liệu
    this.staffCache = [];
    this.deptCache = [];

    // Expose ra window để HTML gọi được
    window.StaffController = this;

    // Biến lưu trạng thái xóa
    this.pendingDeleteItem = null;
    this._injectDeleteModal();

    // Tự động chạy init
    this.init();
  }

  init() {
    // Tab Nhân sự
    if (document.getElementById("staff-list-container")) {
      this.loadDepartmentsToSelect().then(() => {
        this.loadStaffList();
      });
      this.loadRolesToSelect();
    }
  }

  // ============================================================
  // HELPER UI: CUSTOM DROPDOWN
  // ============================================================
  toggleDropdown(id) {
    const el = document.getElementById(id);
    // Đóng các dropdown khác đang mở
    document.querySelectorAll('[id$="-dropdown"]').forEach((d) => {
      if (d.id !== id) d.classList.add("hidden");
    });

    if (el) {
      el.classList.toggle("hidden");
      // Xoay icon
      const icon = el.previousElementSibling.querySelector(
        '[data-lucide="chevron-down"]',
      );
      if (icon)
        icon.style.transform = el.classList.contains("hidden")
          ? "rotate(0deg)"
          : "rotate(180deg)";
    }
  }

  // Hàm chọn cho Staff Modal
  selectCustomOption(type, value, label) {
    const labelEl = document.getElementById(`label-${type}-selected`);
    const inputEl = document.getElementById(`staff-${type}-hidden-val`);
    const dropdown = document.getElementById(`${type}-dropdown`);

    if (labelEl) labelEl.innerText = label;
    if (inputEl) inputEl.value = value;
    if (dropdown) dropdown.classList.add("hidden");

    const icon = dropdown?.previousElementSibling?.querySelector(
      '[data-lucide="chevron-down"]',
    );
    if (icon) icon.style.transform = "rotate(0deg)";
  }

  // ============================================================
  // LOGIC STAFF
  // ============================================================
  async loadStaffList() {
    const container = document.getElementById("staff-list-container");
    if (!container) return;
    this._renderLoading(container);
    const res = await staffService.getAll();
    if (res.status === "success" && Array.isArray(res.data)) {
      this.staffCache = res.data;
      this.renderStaffList(res.data);
    } else {
      this._renderError(container);
    }
  }

  renderStaffList(staffMembers) {
    const container = document.getElementById("staff-list-container");
    if (!container) return;
    if (staffMembers.length === 0) {
      container.innerHTML =
        '<div class="col-span-full text-center text-slate-400 italic">Chưa có nhân sự nào.</div>';
      return;
    }
    let html = "";
    staffMembers.forEach((member) => {
      const isActive = member.active == 1;
      const statusClass = isActive
        ? "bg-[#dcfce7] text-[#166534]"
        : "bg-slate-100 text-slate-400";
      const statusText = isActive ? "ĐANG HOẠT ĐỘNG" : "TẠM KHÓA";
      const roleDisplay = member.role_name
        ? member.role_name.toUpperCase()
        : member.role || "MEMBER";
      let deptDisplay = member.dept_name;
      if (!deptDisplay && member.department && member.department != 0) {
        const dept = this.deptCache.find((d) => d.id == member.department);
        deptDisplay = dept ? dept.name : "ID: " + member.department;
      }
      if (!deptDisplay || deptDisplay == "0" || member.department == 0) {
        deptDisplay = "CHƯA PHÂN PHÒNG";
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
                    <div class="flex items-center gap-3 text-[13px] font-bold text-slate-500"><i data-lucide="mail" width="16" class="text-slate-300 shrink-0"></i><span class="truncate">${member.email || "N/A"}</span></div>
                    <div class="flex items-center gap-3 text-[13px] font-bold text-slate-500"><i data-lucide="phone" width="16" class="text-slate-300 shrink-0"></i><span>${member.phone || "N/A"}</span></div>
                </div>
                <div class="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto">
                    <span class="px-4 py-2 rounded-xl text-[9px] font-[900] uppercase tracking-widest ${statusClass}">${statusText}</span>
                    <div class="flex gap-2">
                         <button onclick="StaffController.openStaffModal(${member.id})" class="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all"><i data-lucide="edit-3" width="18"></i></button>
                         ${member.id != 1 ? `<button onclick="StaffController.deleteStaff(${member.id}, '${member.fullName}')" class="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all"><i data-lucide="trash-2" width="18"></i></button>` : ""}
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
      active: form.active.checked ? 1 : 0,
    };
    if (!data.fullName || !data.username)
      return window.Utils.showToast("Vui lòng điền tên và tài khoản", "error");
    this._toggleBtnLoading("btn-save-staff", true, "ĐANG XỬ LÝ...");
    try {
      const res = data.id
        ? await staffService.update(data)
        : await staffService.create(data);
      if (res.status === "success") {
        if (window.Utils)
          window.Utils.showToast(
            data.id ? "Đã cập nhật!" : "Đã thêm mới!",
            "success",
          );
        this.closeModal();
        await this.loadStaffList();
        if (window.DepartmentController) {
          window.DepartmentController.loadDepartmentList();
        }
      } else {
        alert("Lỗi: " + res.message);
      }
    } catch (e) {
      alert("Lỗi kết nối Server");
    } finally {
      this._toggleBtnLoading(
        "btn-save-staff",
        false,
        data.id ? "CẬP NHẬT" : "LƯU THÔNG TIN",
      );
    }
  }

  async loadDepartmentsToSelect() {
    const res = await deptService.getAll();
    if (res.status === "success" && res.data) {
      this.deptCache = res.data;
      const list = document.getElementById("list-dept-options");
      if (!list) return;
      let html = `<div class="p-3 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-50 cursor-pointer" onclick="StaffController.selectCustomOption('dept', '', 'CHƯA PHÂN PHÒNG')">CHƯA PHÂN PHÒNG</div>`;
      res.data.forEach((d) => {
        html += `<div class="p-3 rounded-xl text-xs font-[800] text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-all uppercase" onclick="StaffController.selectCustomOption('dept', '${d.id}', '${d.name}')">${d.name}</div>`;
      });
      list.innerHTML = html;
    }
  }

  async loadRolesToSelect() {
    const res = await staffService.getRoles();
    if (res.status === "success" && res.data) {
      const list = document.getElementById("list-role-options");
      if (!list) return;
      let html = "";
      res.data.forEach((r) => {
        const rName = (r.name || r.role_name).toUpperCase();

        html += `<div class="p-3 rounded-xl text-xs font-[800] text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-all" onclick="StaffController.selectCustomOption('role', '${r.id}', '${rName}')">${rName}</div>`;
      });
      list.innerHTML = html;
    }
  }

  deleteStaff(id, name) {
    this.openDeleteModal("staff", id, name);
  }
  closeModal() {
    document.getElementById("staff-form-modal")?.classList.add("hidden");
  }

  openStaffModal(id = null) {
    const modal = document.getElementById("staff-form-modal");
    const form = document.getElementById("staff-form");
    const idInput = document.getElementById("staff-id");
    const modalTitle = document.getElementById("modal-title");
    const avatarPreview = document.getElementById("staff-modal-avatar-preview");

    if (!modal || !form) return;
    form.reset();
    if (id) {
      modalTitle.innerText = "CẬP NHẬT NHÂN SỰ";
      const member = this.staffCache.find((u) => u.id == id);
      if (member) {
        idInput.value = member.id;
        form.elements["fullName"].value = member.fullName;
        form.elements["username"].value = member.username;
        form.elements["email"].value = member.email || "";
        form.elements["phone"].value = member.phone || "";

        if (avatarPreview) {
          avatarPreview.src = member.avatar
            ? member.avatar
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=random&size=128`;
        }

        const dept = this.deptCache.find((d) => d.id == member.department);
        this.selectCustomOption(
          "dept",
          member.department || "",
          dept ? dept.name.toUpperCase() : "CHƯA PHÂN PHÒNG",
        );
        this.selectCustomOption(
          "role",
          member.role,
          member.role_name ? member.role_name.toUpperCase() : "NHÂN VIÊN",
        );
        form.elements["active"].checked = member.active == 1;
        form.elements["password"].placeholder = "Để trống nếu không đổi";
      }
    } else {
      modalTitle.innerText = "THÊM NHÂN SỰ MỚI";
      idInput.value = "";

      if (avatarPreview)
        avatarPreview.src =
          "https://ui-avatars.com/api/?name=User&background=random&size=128";

      this.selectCustomOption("dept", "", "-- Chọn phòng ban --");
      this.selectCustomOption("role", "STAFF", "NHÂN VIÊN");
      form.elements["active"].checked = true;
      form.elements["password"].placeholder = "••••••";
    }
    modal.classList.remove("hidden");
  }

  // Helpers
  _renderLoading(container) {
    container.innerHTML =
      '<div class="col-span-full py-20 flex flex-col items-center justify-center text-slate-300"><i data-lucide="loader-2" width="32" class="animate-spin mb-2"></i><span class="text-xs font-bold uppercase">Đang tải dữ liệu...</span></div>';
    if (window.lucide) lucide.createIcons();
  }
  _renderError(container) {
    container.innerHTML =
      '<div class="col-span-full text-center text-rose-500 font-bold">Lỗi tải dữ liệu.</div>';
  }
  _toggleBtnLoading(btnId, isLoading, text) {
    if (window.Utils) window.Utils.toggleLoading(btnId, isLoading, text);
  }

  // Modal Delete
  _injectDeleteModal() {
    if (document.getElementById("staff-delete-modal")) return;
    const modalHTML = `<div id="staff-delete-modal" class="fixed inset-0 z-[9999] hidden flex items-center justify-center transition-all duration-200 opacity-0 pointer-events-none"><div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onclick="StaffController.closeDeleteModal()"></div><div class="bg-white rounded-[24px] p-6 w-[90%] max-w-sm shadow-2xl relative z-10 transform scale-95 transition-all duration-200"><div class="flex flex-col items-center text-center"><div class="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4 shadow-sm shadow-rose-100"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><h3 class="text-lg font-[900] text-slate-800 mb-2 uppercase tracking-tight">Xác nhận xóa?</h3><p class="text-slate-500 text-xs font-medium mb-6 leading-relaxed">Bạn đang chuẩn bị xóa <span id="staff-del-item-name" class="font-bold text-slate-800">mục này</span>.<br>Hành động này <span class="text-rose-500 font-bold">không thể hoàn tác</span>!</p><div class="flex gap-3 w-full"><button onclick="StaffController.closeDeleteModal()" class="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-[900] uppercase tracking-wider hover:bg-slate-200 transition-all">Hủy bỏ</button><button onclick="StaffController.executeDelete()" id="staff-btn-confirm-delete" class="flex-1 py-3 rounded-xl bg-rose-500 text-white text-xs font-[900] uppercase tracking-wider hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all">Xóa ngay</button></div></div></div></div>`;
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }

  openDeleteModal(type, id, name = "mục này") {
    this.pendingDeleteItem = { type, id };
    const modal = document.getElementById("staff-delete-modal");
    const nameEl = document.getElementById("staff-del-item-name");
    if (modal && nameEl) {
      nameEl.innerText = `nhân viên "${name}"`;
      modal.classList.remove("hidden", "pointer-events-none");
      setTimeout(() => {
        modal.classList.remove("opacity-0");
        modal.querySelector("div.transform").classList.remove("scale-95");
        modal.querySelector("div.transform").classList.add("scale-100");
      }, 10);
    }
  }

  closeDeleteModal() {
    this.pendingDeleteItem = null;
    const modal = document.getElementById("staff-delete-modal");
    if (modal) {
      modal.classList.add("opacity-0");
      modal.querySelector("div.transform").classList.remove("scale-100");
      modal.querySelector("div.transform").classList.add("scale-95");
      setTimeout(
        () => modal.classList.add("hidden", "pointer-events-none"),
        200,
      );
    }
  }

  async executeDelete() {
    if (!this.pendingDeleteItem) return;
    const { type, id } = this.pendingDeleteItem;
    const btn = document.getElementById("staff-btn-confirm-delete");
    const originalText = btn.innerText;
    btn.innerText = "Đang xóa...";
    btn.disabled = true;
    let res;
    if (type === "staff") {
      res = await staffService.delete(id);
    }
    btn.innerText = originalText;
    btn.disabled = false;
    this.closeDeleteModal();
    if (res && res.status === "success") {
      window.Utils.showToast("Đã xóa thành công!", "success");
      this.loadStaffList();
    } else {
      window.Utils.showToast(res ? res.message : "Lỗi không xác định", "error");
    }
  }
}

new StaffController();
