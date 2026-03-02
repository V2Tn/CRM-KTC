import staffService from "../service/admin/staff-min.js";
import deptService from "../service/admin/department-min.js";
class StaffController {
  constructor() {
    ((this.staffCache = []),
      (this.deptCache = []),
      (window.StaffController = this),
      (this.pendingDeleteItem = null),
      this._injectDeleteModal(),
      this.init());
  }
  init() {
    document.getElementById("staff-list-container") &&
      (this.loadDepartmentsToSelect().then(() => {
        this.loadStaffList();
      }),
      this.loadRolesToSelect());
  }
  toggleDropdown(e) {
    const t = document.getElementById(e);
    if (
      (document.querySelectorAll('[id$="-dropdown"]').forEach((t) => {
        t.id !== e && t.classList.add("hidden");
      }),
      t)
    ) {
      t.classList.toggle("hidden");
      const e = t.previousElementSibling.querySelector(
        '[data-lucide="chevron-down"]',
      );
      e &&
        (e.style.transform = t.classList.contains("hidden")
          ? "rotate(0deg)"
          : "rotate(180deg)");
    }
  }
  selectCustomOption(e, t, s) {
    const a = document.getElementById(`label-${e}-selected`),
      n = document.getElementById(`staff-${e}-hidden-val`),
      l = document.getElementById(`${e}-dropdown`);
    (a && (a.innerText = s),
      n && (n.value = t),
      l && l.classList.add("hidden"));
    const i = l?.previousElementSibling?.querySelector(
      '[data-lucide="chevron-down"]',
    );
    i && (i.style.transform = "rotate(0deg)");
  }
  async loadStaffList() {
    const e = document.getElementById("staff-list-container");
    if (!e) return;
    this._renderLoading(e);
    const t = await staffService.getAll();
    "success" === t.status && Array.isArray(t.data)
      ? ((this.staffCache = t.data), this.renderStaffList(t.data))
      : this._renderError(e);
  }
  renderStaffList(e) {
    const t = document.getElementById("staff-list-container");
    if (!t) return;
    if (0 === e.length)
      return void (t.innerHTML =
        '<div class="col-span-full text-center text-slate-400 italic">Chưa có nhân sự nào.</div>');
    let s = "";
    (e.forEach((e) => {
      const t = 1 == e.active,
        a = t ? "bg-[#dcfce7] text-[#166534]" : "bg-slate-100 text-slate-400",
        n = t ? "ĐANG HOẠT ĐỘNG" : "TẠM KHÓA",
        l = e.role_name ? e.role_name.toUpperCase() : e.role || "MEMBER";
      let i = e.dept_name;
      if (!i && e.department && 0 != e.department) {
        const t = this.deptCache.find((t) => t.id == e.department);
        i = t ? t.name : "ID: " + e.department;
      }
      i =
        i && "0" != i && 0 != e.department
          ? i.toUpperCase()
          : "CHƯA PHÂN PHÒNG";
      const o = e.avatar
        ? e.avatar
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(e.fullName)}&background=random&size=128`;
      s += `\n            <div class="bg-white rounded-[32px] p-8 border border-slate-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">\n                <div class="flex items-start gap-5 mb-8">\n                    <img src="${o}" class="w-16 h-16 rounded-[24px] object-cover border border-slate-100 shrink-0 shadow-sm bg-slate-50">\n                    \n                    <div class="pt-1">\n                        <h3 class="font-[900] text-[17px] text-slate-900 leading-tight mb-1.5 line-clamp-1">${e.fullName}</h3>\n                        <div class="flex items-center gap-2 text-[10px] font-black tracking-widest">\n                             <span class="text-indigo-600 whitespace-nowrap">${i}</span>\n                             <span class="text-slate-300">•</span>\n                             <span class="text-slate-400">${l}</span>\n                        </div>\n                    </div>\n                </div>\n                <div class="space-y-3 mb-8 flex-1 pl-1">\n                    <div class="flex items-center gap-3 text-[13px] font-bold text-slate-500"><i data-lucide="mail" width="16" class="text-slate-300 shrink-0"></i><span class="truncate">${e.email || "N/A"}</span></div>\n                    <div class="flex items-center gap-3 text-[13px] font-bold text-slate-500"><i data-lucide="phone" width="16" class="text-slate-300 shrink-0"></i><span>${e.phone || "N/A"}</span></div>\n                </div>\n                <div class="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto">\n                    <span class="px-4 py-2 rounded-xl text-[9px] font-[900] uppercase tracking-widest ${a}">${n}</span>\n                    <div class="flex gap-2">\n                         <button onclick="StaffController.openStaffModal(${e.id})" class="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all"><i data-lucide="edit-3" width="18"></i></button>\n                         ${1 != e.id ? `<button onclick="StaffController.deleteStaff(${e.id}, '${e.fullName}')" class="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all"><i data-lucide="trash-2" width="18"></i></button>` : ""}\n                    </div>\n                </div>\n            </div>`;
    }),
      (t.innerHTML = s),
      window.lucide && lucide.createIcons());
  }
  async saveStaff(e) {
    e.preventDefault();
    const t = e.target,
      s = {
        id: t.id.value,
        fullName: t.fullName.value.trim(),
        username: t.username.value.trim(),
        password: t.password.value.trim(),
        email: t.email.value.trim(),
        phone: t.phone.value.trim(),
        role: t.role.value,
        department: t.department.value,
        active: t.active.checked ? 1 : 0,
      };
    if (!s.fullName || !s.username)
      return window.Utils.showToast("Vui lòng điền tên và tài khoản", "error");
    this._toggleBtnLoading("btn-save-staff", !0, "ĐANG XỬ LÝ...");
    try {
      const e = s.id
        ? await staffService.update(s)
        : await staffService.create(s);
      "success" === e.status
        ? (window.Utils &&
            window.Utils.showToast(
              s.id ? "Đã cập nhật!" : "Đã thêm mới!",
              "success",
            ),
          this.closeModal(),
          await this.loadStaffList(),
          window.DepartmentController &&
            window.DepartmentController.loadDepartmentList())
        : alert("Lỗi: " + e.message);
    } catch (e) {
      alert("Lỗi kết nối Server");
    } finally {
      this._toggleBtnLoading(
        "btn-save-staff",
        !1,
        s.id ? "CẬP NHẬT" : "LƯU THÔNG TIN",
      );
    }
  }
  async loadDepartmentsToSelect() {
    const e = await deptService.getAll();
    if ("success" === e.status && e.data) {
      this.deptCache = e.data;
      const t = document.getElementById("list-dept-options");
      if (!t) return;
      let s =
        "<div class=\"p-3 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-50 cursor-pointer\" onclick=\"StaffController.selectCustomOption('dept', '', 'CHƯA PHÂN PHÒNG')\">CHƯA PHÂN PHÒNG</div>";
      (e.data.forEach((e) => {
        s += `<div class="p-3 rounded-xl text-xs font-[800] text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-all uppercase" onclick="StaffController.selectCustomOption('dept', '${e.id}', '${e.name}')">${e.name}</div>`;
      }),
        (t.innerHTML = s));
    }
  }
  async loadRolesToSelect() {
    const e = await staffService.getRoles();
    if ("success" === e.status && e.data) {
      const t = document.getElementById("list-role-options");
      if (!t) return;
      let s = "";
      (e.data.forEach((e) => {
        const t = (e.name || e.role_name).toUpperCase();
        s += `<div class="p-3 rounded-xl text-xs font-[800] text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-all" onclick="StaffController.selectCustomOption('role', '${e.id}', '${t}')">${t}</div>`;
      }),
        (t.innerHTML = s));
    }
  }
  deleteStaff(e, t) {
    this.openDeleteModal("staff", e, t);
  }
  closeModal() {
    document.getElementById("staff-form-modal")?.classList.add("hidden");
  }
  openStaffModal(e = null) {
    const t = document.getElementById("staff-form-modal"),
      s = document.getElementById("staff-form"),
      a = document.getElementById("staff-id"),
      n = document.getElementById("modal-title"),
      l = document.getElementById("staff-modal-avatar-preview");
    if (t && s) {
      if ((s.reset(), e)) {
        n.innerText = "CẬP NHẬT NHÂN SỰ";
        const t = this.staffCache.find((t) => t.id == e);
        if (t) {
          ((a.value = t.id),
            (s.elements.fullName.value = t.fullName),
            (s.elements.username.value = t.username),
            (s.elements.email.value = t.email || ""),
            (s.elements.phone.value = t.phone || ""),
            l &&
              (l.src = t.avatar
                ? t.avatar
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(t.fullName)}&background=random&size=128`));
          const e = this.deptCache.find((e) => e.id == t.department);
          (this.selectCustomOption(
            "dept",
            t.department || "",
            e ? e.name.toUpperCase() : "CHƯA PHÂN PHÒNG",
          ),
            this.selectCustomOption(
              "role",
              t.role,
              t.role_name ? t.role_name.toUpperCase() : "NHÂN VIÊN",
            ),
            (s.elements.active.checked = 1 == t.active),
            (s.elements.password.placeholder = "Để trống nếu không đổi"));
        }
      } else
        ((n.innerText = "THÊM NHÂN SỰ MỚI"),
          (a.value = ""),
          l &&
            (l.src =
              "https://ui-avatars.com/api/?name=User&background=random&size=128"),
          this.selectCustomOption("dept", "", "-- Chọn phòng ban --"),
          this.selectCustomOption("role", "STAFF", "NHÂN VIÊN"),
          (s.elements.active.checked = !0),
          (s.elements.password.placeholder = "••••••"));
      t.classList.remove("hidden");
    }
  }
  _renderLoading(e) {
    ((e.innerHTML =
      '<div class="col-span-full py-20 flex flex-col items-center justify-center text-slate-300"><i data-lucide="loader-2" width="32" class="animate-spin mb-2"></i><span class="text-xs font-bold uppercase">Đang tải dữ liệu...</span></div>'),
      window.lucide && lucide.createIcons());
  }
  _renderError(e) {
    e.innerHTML =
      '<div class="col-span-full text-center text-rose-500 font-bold">Lỗi tải dữ liệu.</div>';
  }
  _toggleBtnLoading(e, t, s) {
    window.Utils && window.Utils.toggleLoading(e, t, s);
  }
  _injectDeleteModal() {
    if (document.getElementById("staff-delete-modal")) return;
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div id="staff-delete-modal" class="fixed inset-0 z-[9999] hidden flex items-center justify-center transition-all duration-200 opacity-0 pointer-events-none"><div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onclick="StaffController.closeDeleteModal()"></div><div class="bg-white rounded-[24px] p-6 w-[90%] max-w-sm shadow-2xl relative z-10 transform scale-95 transition-all duration-200"><div class="flex flex-col items-center text-center"><div class="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4 shadow-sm shadow-rose-100"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><h3 class="text-lg font-[900] text-slate-800 mb-2 uppercase tracking-tight">Xác nhận xóa?</h3><p class="text-slate-500 text-xs font-medium mb-6 leading-relaxed">Bạn đang chuẩn bị xóa <span id="staff-del-item-name" class="font-bold text-slate-800">mục này</span>.<br>Hành động này <span class="text-rose-500 font-bold">không thể hoàn tác</span>!</p><div class="flex gap-3 w-full"><button onclick="StaffController.closeDeleteModal()" class="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-[900] uppercase tracking-wider hover:bg-slate-200 transition-all">Hủy bỏ</button><button onclick="StaffController.executeDelete()" id="staff-btn-confirm-delete" class="flex-1 py-3 rounded-xl bg-rose-500 text-white text-xs font-[900] uppercase tracking-wider hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all">Xóa ngay</button></div></div></div></div>',
    );
  }
  openDeleteModal(e, t, s = "mục này") {
    this.pendingDeleteItem = { type: e, id: t };
    const a = document.getElementById("staff-delete-modal"),
      n = document.getElementById("staff-del-item-name");
    a &&
      n &&
      ((n.innerText = `nhân viên "${s}"`),
      a.classList.remove("hidden", "pointer-events-none"),
      setTimeout(() => {
        (a.classList.remove("opacity-0"),
          a.querySelector("div.transform").classList.remove("scale-95"),
          a.querySelector("div.transform").classList.add("scale-100"));
      }, 10));
  }
  closeDeleteModal() {
    this.pendingDeleteItem = null;
    const e = document.getElementById("staff-delete-modal");
    e &&
      (e.classList.add("opacity-0"),
      e.querySelector("div.transform").classList.remove("scale-100"),
      e.querySelector("div.transform").classList.add("scale-95"),
      setTimeout(() => e.classList.add("hidden", "pointer-events-none"), 200));
  }
  async executeDelete() {
    if (!this.pendingDeleteItem) return;
    const { type: e, id: t } = this.pendingDeleteItem,
      s = document.getElementById("staff-btn-confirm-delete"),
      a = s.innerText;
    let n;
    ((s.innerText = "Đang xóa..."),
      (s.disabled = !0),
      "staff" === e && (n = await staffService.delete(t)),
      (s.innerText = a),
      (s.disabled = !1),
      this.closeDeleteModal(),
      n && "success" === n.status
        ? (window.Utils.showToast("Đã xóa thành công!", "success"),
          this.loadStaffList())
        : window.Utils.showToast(
            n ? n.message : "Lỗi không xác định",
            "error",
          ));
  }
}
new StaffController();
