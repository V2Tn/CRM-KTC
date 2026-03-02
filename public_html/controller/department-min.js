import staffService from "../service/admin/staff-min.js";
import deptService from "../service/admin/department-min.js";
class DepartmentController {
  constructor() {
    ((this.deptCache = []),
      (this.managersCache = []),
      (this.currentDeptMembers = []),
      (this.availableUsers = []),
      (window.DepartmentController = this),
      (this.pendingDeleteItem = null),
      this._injectDeleteModal(),
      (this.pendingManagerChange = null),
      this._injectManagerChangeModal(),
      this.init());
  }
  init() {
    const e =
      "MANAGER" ===
      JSON.parse(localStorage.getItem("current_session_user") || "{}").role;
    if (document.getElementById("department-list-container")) {
      const t = document.getElementById("btn-add-dept");
      (t && (e ? t.classList.add("hidden") : t.classList.remove("hidden")),
        this.loadDepartmentList());
    }
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
  selectDeptManager(e, t) {
    const n = document.getElementById("label-manager-selected"),
      a = document.getElementById("dept-manager-hidden-val"),
      s = document.getElementById("manager-dropdown");
    (n && (n.innerText = t),
      a && (a.value = e),
      s && s.classList.add("hidden"));
    const r = s?.previousElementSibling?.querySelector(
      '[data-lucide="chevron-down"]',
    );
    if (
      (r && (r.style.transform = "rotate(0deg)"),
      this.checkManagerConflict(e),
      e)
    ) {
      if (!this.currentDeptMembers.some((t) => t.id == e)) {
        const t = this.managersCache.find((t) => t.id == e);
        t &&
          (this.currentDeptMembers.push(t),
          this.renderCurrentMembers(),
          (this.availableUsers = this.availableUsers.filter((t) => t.id != e)),
          this.renderAvailableMembers());
      }
    }
  }
  handleManagerSelection(e, t) {
    const n = document.getElementById("dept-manager-hidden-val").value,
      a = document.getElementById("label-manager-selected").innerText;
    document.getElementById("manager-dropdown")?.classList.add("hidden");
    const s = document
      .getElementById("manager-dropdown")
      ?.previousElementSibling?.querySelector('[data-lucide="chevron-down"]');
    if ((s && (s.style.transform = "rotate(0deg)"), n && n !== e && "" !== e)) {
      ((this.pendingManagerChange = { id: e, name: t }),
        (document.getElementById("current-manager-name").innerText = a),
        (document.getElementById("new-manager-name").innerText = t));
      const n = document.getElementById("manager-change-modal");
      (n.classList.remove("hidden", "pointer-events-none"),
        setTimeout(() => {
          (n.classList.remove("opacity-0"),
            n.querySelector("div.transform").classList.remove("scale-95"),
            n.querySelector("div.transform").classList.add("scale-100"),
            window.lucide && lucide.createIcons());
        }, 10));
    } else this.selectDeptManager(e, t);
  }
  cancelManagerChange() {
    this.pendingManagerChange = null;
    const e = document.getElementById("manager-change-modal");
    e &&
      (e.classList.add("opacity-0"),
      e.querySelector("div.transform").classList.remove("scale-100"),
      e.querySelector("div.transform").classList.add("scale-95"),
      setTimeout(() => e.classList.add("hidden", "pointer-events-none"), 200));
  }
  confirmManagerChange() {
    (this.pendingManagerChange &&
      this.selectDeptManager(
        this.pendingManagerChange.id,
        this.pendingManagerChange.name,
      ),
      this.cancelManagerChange());
  }
  async openDeptModal(e = null) {
    const t = document.getElementById("dept-form-modal"),
      n = document.getElementById("dept-form"),
      a = document.getElementById("dept-id"),
      s = document.getElementById("dept-modal-title"),
      r = JSON.parse(localStorage.getItem("current_session_user") || "{}"),
      i = "MANAGER" === r.role;
    if (!t || !n) return;
    (n.reset(),
      document.getElementById("manager-warning")?.classList.add("hidden"),
      document
        .getElementById("btn-manager-select")
        ?.classList.remove("border-rose-500", "bg-rose-50"));
    const l = document.getElementById("btn-delete-dept-modal");
    (l && (i ? l.classList.add("hidden") : l.classList.remove("hidden")),
      i || (await this.loadManagersToSelect()));
    const d = await staffService.getAvailableUsers();
    if (((this.availableUsers = "success" === d.status ? d.data : []), e)) {
      const t = this.deptCache.find((t) => t.id == e);
      if (t) {
        (s && (s.innerText = t.name),
          a && (a.value = t.id),
          n.elements.name && (n.elements.name.value = t.name),
          n.elements.description &&
            (n.elements.description.value = t.description || ""));
        const l = t.managerId || "";
        let d = "-- Chọn quản lý --";
        if (i) {
          d = r.fullName + " (Tôi)";
          const e = document.getElementById("btn-manager-select");
          e &&
            (e.classList.add(
              "pointer-events-none",
              "opacity-60",
              "bg-slate-100",
            ),
            (e.onclick = null));
        } else {
          if (l) {
            const e = this.managersCache.find((e) => e.id == l);
            e && (d = e.fullName);
          }
          const e = document.getElementById("btn-manager-select");
          e &&
            (e.classList.remove(
              "pointer-events-none",
              "opacity-60",
              "bg-slate-100",
            ),
            e.setAttribute(
              "onclick",
              "DepartmentController.toggleDropdown('manager-dropdown')",
            ));
        }
        this.selectDeptManager(l, d);
        const o = await staffService.getMembersByDept(e);
        this.currentDeptMembers = "success" === o.status ? o.data : [];
      }
    } else
      (s && (s.innerText = "THÊM PHÒNG BAN"),
        a && (a.value = ""),
        this.selectDeptManager("", "-- Chọn quản lý --"),
        (this.currentDeptMembers = []));
    (this.renderCurrentMembers(),
      this.renderAvailableMembers(),
      this.toggleAddMemberView(!1),
      t.classList.remove("hidden"));
  }
  closeDeptModal() {
    document.getElementById("dept-form-modal")?.classList.add("hidden");
  }
  async loadManagersToSelect() {
    const e = document.getElementById("list-manager-options");
    if (!e) return;
    const t = await staffService.getManagers();
    if ("success" === t.status) {
      this.managersCache = t.data;
      let n =
        "<div class=\"p-3 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-50 cursor-pointer transition-all\" \n                        onclick=\"DepartmentController.handleManagerSelection('', '-- Chọn quản lý --')\">-- Bỏ chọn --</div>";
      (t.data.forEach((e) => {
        n += `<div class="p-3 rounded-xl text-xs font-[800] text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-all flex justify-between items-center" \n                        onclick="DepartmentController.handleManagerSelection('${e.id}', '${e.fullName}')">\n                            <span>${e.fullName}</span>\n                            <span class="text-[9px] text-slate-300 font-normal">@${e.username}</span>\n                        </div>`;
      }),
        (e.innerHTML = n));
    }
  }
  checkManagerConflict(e) {
    const t = document.getElementById("btn-manager-select"),
      n = document.getElementById("manager-warning"),
      a = document.getElementById("manager-warning-text"),
      s = document.getElementById("dept-id").value;
    if (!t || !n) return;
    if (!e)
      return (
        n.classList.add("hidden"),
        void t.classList.remove("border-rose-500", "bg-rose-50")
      );
    const r = this.managersCache.find((t) => t.id == e);
    r && r.current_dept_id && r.current_dept_id != s
      ? ((a.innerText = `${r.username} đang quản lý ${r.current_dept_name}`),
        n.classList.remove("hidden"),
        window.Utils.showToast(
          `Cảnh báo: ${r.fullName} đang quản lý phòng khác!`,
          "error",
        ),
        t.classList.add("border-rose-500", "bg-rose-50"))
      : (n.classList.add("hidden"),
        t.classList.remove("border-rose-500", "bg-rose-50"));
  }
  async saveDept(e) {
    e.preventDefault();
    const t = e.target,
      n = document.getElementById("dept-manager-hidden-val").value;
    let a = this.currentDeptMembers.map((e) => e.id);
    n && !a.some((e) => e == n) && a.push(n);
    const s = {
      id: t.id.value,
      name: t.name.value.trim(),
      description: t.description.value.trim(),
      manager_id: n,
      members: a,
    };
    if (!s.name)
      return window.Utils.showToast("Vui lòng nhập tên phòng ban", "error");
    this._toggleBtnLoading("btn-save-dept", !0, "ĐANG LƯU...");
    try {
      const e = s.id
        ? await deptService.update(s)
        : await deptService.create(s);
      "success" === e.status
        ? (window.Utils &&
            window.Utils.showToast(
              s.id ? "Đã cập nhật!" : "Thêm thành công!",
              "success",
            ),
          this.closeDeptModal(),
          this.loadDepartmentList(),
          window.StaffController &&
            (window.StaffController.loadStaffList(),
            window.StaffController.loadDepartmentsToSelect()))
        : alert("Lỗi: " + e.message);
    } catch (e) {
      alert("Lỗi kết nối Server");
    } finally {
      this._toggleBtnLoading("btn-save-dept", !1, "LƯU THAY ĐỔI");
    }
  }
  async loadDepartmentList() {
    const e = document.getElementById("department-list-container");
    if (!e) return;
    this._renderLoading(e);
    const t = await deptService.getAll();
    "success" === t.status
      ? ((this.deptCache = t.data), this.renderDepartmentList(t.data))
      : this._renderError(e);
  }
  renderDepartmentList(e) {
    const t = document.getElementById("department-list-container");
    if (!t) return;
    const n =
      "MANAGER" ===
      JSON.parse(localStorage.getItem("current_session_user") || "{}").role;
    if (0 === e.length)
      return void (t.innerHTML =
        '<div class="col-span-full text-center text-slate-400 italic">Chưa có phòng ban nào.</div>');
    let a = "";
    (e.forEach((e) => {
      const t = n
        ? ""
        : `<button onclick="DepartmentController.deleteDept(${e.id}, '${e.name}')" class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all"><i data-lucide="trash-2" width="16"></i></button>`;
      a += `<div class="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full relative overflow-hidden"><div class="absolute -right-6 -top-6 w-24 h-24 bg-slate-50 rounded-full group-hover:bg-indigo-50 transition-colors duration-500"></div><div class="relative z-10"><div class="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"><i data-lucide="briefcase" width="24"></i></div><h3 class="font-[900] text-lg text-slate-800 uppercase tracking-tight mb-2">${e.name}</h3><p class="text-xs font-bold text-slate-400 mb-8 line-clamp-2 h-8">${e.description || "..."}</p><div class="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto"><div class="px-4 py-2 bg-[#eff6ff] text-indigo-600 rounded-xl text-[10px] font-[900] uppercase tracking-widest flex items-center gap-2"><i data-lucide="users" width="12"></i><span>${e.staff_count || 0} NHÂN VIÊN</span></div><div class="flex gap-2"><button onclick="DepartmentController.openDeptModal(${e.id})" class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all"><i data-lucide="edit-3" width="16"></i></button>${t}</div></div></div></div>`;
    }),
      (t.innerHTML = a),
      window.lucide && lucide.createIcons());
  }
  renderCurrentMembers() {
    const e = document.getElementById("current-members-list"),
      t = document.getElementById("member-count");
    if (!e) return;
    if (
      ((t.innerText = this.currentDeptMembers.length),
      0 === this.currentDeptMembers.length)
    )
      return void (e.innerHTML =
        '<div class="text-center text-slate-300 text-xs py-10 italic">Chưa có thành viên nào</div>');
    let n = "";
    (this.currentDeptMembers.forEach((e) => {
      const t = e.avatar
        ? e.avatar
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(e.fullName)}&background=random&size=64`;
      n += `\n            <div class="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between group shadow-sm">\n                <div class="flex items-center gap-3">\n                    <img src="${t}" class="w-8 h-8 rounded-lg object-cover border border-slate-100 shadow-sm">\n                    <div><p class="text-xs font-bold text-slate-700">${e.fullName}</p></div>\n                </div>\n                <button type="button" onclick="DepartmentController.removeMemberFromDept(${e.id})" class="text-slate-300 hover:text-rose-500 p-1"><i data-lucide="minus-circle" width="16"></i></button>\n            </div>`;
    }),
      (e.innerHTML = n),
      window.lucide && lucide.createIcons());
  }
  renderAvailableMembers() {
    const e = document.getElementById("available-members-list"),
      t =
        document.getElementById("search-member-input")?.value.toLowerCase() ||
        "",
      n = this.currentDeptMembers.map((e) => e.id),
      a = this.availableUsers.filter(
        (e) => e.fullName.toLowerCase().includes(t) && !n.includes(e.id),
      );
    let s = "";
    (0 === a.length
      ? (s =
          '<div class="text-center text-slate-300 text-xs py-10">Không tìm thấy nhân viên phù hợp</div>')
      : a.forEach((e) => {
          const t = e.current_dept_name
              ? `<span class="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">${e.current_dept_name}</span>`
              : '<span class="text-[9px] text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded ml-1">Tự do</span>',
            n = e.avatar
              ? e.avatar
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(e.fullName)}&background=random&size=64`;
          s += `\n                <div class="bg-white p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-sm cursor-pointer transition-all flex items-center justify-between group mb-2" onclick="DepartmentController.addMemberToDept(${e.id})">\n                    <div class="flex items-center gap-3 overflow-hidden">\n                        <img src="${n}" class="w-8 h-8 rounded-full object-cover border border-slate-100 shrink-0">\n                        <div class="truncate">\n                            <p class="text-xs font-bold text-slate-700 group-hover:text-indigo-700 transition-colors truncate">${e.fullName}</p>\n                            <div class="flex items-center gap-1">${t}</div>\n                        </div>\n                    </div>\n                    <div class="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-500 group-hover:text-white transition-all"><i data-lucide="plus" width="14"></i></div>\n                </div>`;
        }),
      (e.innerHTML = s),
      window.lucide && lucide.createIcons());
  }
  addMemberToDept(e) {
    const t = this.availableUsers.findIndex((t) => t.id == e);
    t > -1 &&
      (this.currentDeptMembers.push(this.availableUsers[t]),
      this.availableUsers.splice(t, 1),
      this.renderCurrentMembers(),
      this.renderAvailableMembers());
  }
  removeMemberFromDept(e) {
    const t = this.currentDeptMembers.findIndex((t) => t.id == e);
    t > -1 &&
      (this.availableUsers.push(this.currentDeptMembers[t]),
      this.currentDeptMembers.splice(t, 1),
      this.renderCurrentMembers(),
      this.renderAvailableMembers());
  }
  toggleAddMemberView(e) {
    const t = document.getElementById("add-member-overlay");
    e
      ? t.classList.remove("translate-x-full")
      : t.classList.add("translate-x-full");
  }
  filterAvailableMembers() {
    this.renderAvailableMembers();
  }
  deleteDept(e, t) {
    this.openDeleteModal("dept", e, t);
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
  _toggleBtnLoading(e, t, n) {
    window.Utils && window.Utils.toggleLoading(e, t, n);
  }
  _injectDeleteModal() {
    if (document.getElementById("dept-delete-modal")) return;
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div id="dept-delete-modal" class="fixed inset-0 z-[9999] hidden flex items-center justify-center transition-all duration-200 opacity-0 pointer-events-none"><div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onclick="DepartmentController.closeDeleteModal()"></div><div class="bg-white rounded-[24px] p-6 w-[90%] max-w-sm shadow-2xl relative z-10 transform scale-95 transition-all duration-200"><div class="flex flex-col items-center text-center"><div class="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4 shadow-sm shadow-rose-100"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><h3 class="text-lg font-[900] text-slate-800 mb-2 uppercase tracking-tight">Xác nhận xóa?</h3><p class="text-slate-500 text-xs font-medium mb-6 leading-relaxed">Bạn đang chuẩn bị xóa <span id="dept-del-item-name" class="font-bold text-slate-800">mục này</span>.<br>Hành động này <span class="text-rose-500 font-bold">không thể hoàn tác</span>!</p><div class="flex gap-3 w-full"><button onclick="DepartmentController.closeDeleteModal()" class="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-[900] uppercase tracking-wider hover:bg-slate-200 transition-all">Hủy bỏ</button><button onclick="DepartmentController.executeDelete()" id="dept-btn-confirm-delete" class="flex-1 py-3 rounded-xl bg-rose-500 text-white text-xs font-[900] uppercase tracking-wider hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all">Xóa ngay</button></div></div></div></div>',
    );
  }
  openDeleteModal(e, t, n = "mục này") {
    this.pendingDeleteItem = { type: e, id: t };
    const a = document.getElementById("dept-delete-modal"),
      s = document.getElementById("dept-del-item-name");
    a &&
      s &&
      ((s.innerText = `phòng ban "${n}"`),
      a.classList.remove("hidden", "pointer-events-none"),
      setTimeout(() => {
        (a.classList.remove("opacity-0"),
          a.querySelector("div.transform").classList.remove("scale-95"),
          a.querySelector("div.transform").classList.add("scale-100"));
      }, 10));
  }
  closeDeleteModal() {
    this.pendingDeleteItem = null;
    const e = document.getElementById("dept-delete-modal");
    e &&
      (e.classList.add("opacity-0"),
      e.querySelector("div.transform").classList.remove("scale-100"),
      e.querySelector("div.transform").classList.add("scale-95"),
      setTimeout(() => e.classList.add("hidden", "pointer-events-none"), 200));
  }
  async executeDelete() {
    if (!this.pendingDeleteItem) return;
    const { type: e, id: t } = this.pendingDeleteItem,
      n = document.getElementById("dept-btn-confirm-delete"),
      a = n.innerText;
    let s;
    ((n.innerText = "Đang xóa..."),
      (n.disabled = !0),
      "dept" === e && (s = await deptService.delete(t)),
      (n.innerText = a),
      (n.disabled = !1),
      this.closeDeleteModal(),
      s && "success" === s.status
        ? (window.Utils.showToast("Đã xóa thành công!", "success"),
          this.loadDepartmentList(),
          window.StaffController &&
            window.StaffController.loadDepartmentsToSelect())
        : window.Utils.showToast(
            s ? s.message : "Lỗi không xác định",
            "error",
          ));
  }
  _injectManagerChangeModal() {
    if (document.getElementById("manager-change-modal")) return;
    document.body.insertAdjacentHTML(
      "beforeend",
      '\n        <div id="manager-change-modal" class="fixed inset-0 z-[10005] hidden flex items-center justify-center transition-all duration-200 opacity-0 pointer-events-none">\n            <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onclick="DepartmentController.cancelManagerChange()"></div>\n            <div class="bg-white rounded-[24px] p-6 w-[90%] max-w-sm shadow-2xl relative z-10 transform scale-95 transition-all duration-200">\n                <div class="flex flex-col items-center text-center">\n                    <div class="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-4 shadow-sm shadow-amber-100">\n                        <i data-lucide="alert-triangle" width="28"></i>\n                    </div>\n                    <h3 class="text-lg font-[900] text-slate-800 mb-2 uppercase tracking-tight">Thay đổi Quản lý?</h3>\n                    <p class="text-slate-500 text-xs font-medium mb-6 leading-relaxed">\n                        Phòng ban này đang được quản lý bởi <span id="current-manager-name" class="font-black text-slate-800 uppercase">...</span>.<br>\n                        Bạn có chắc chắn muốn chuyển quyền cho <span id="new-manager-name" class="font-black text-indigo-600 uppercase">...</span> không?\n                    </p>\n                    <div class="flex gap-3 w-full">\n                        <button onclick="DepartmentController.cancelManagerChange()" class="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-[900] uppercase tracking-wider hover:bg-slate-200 transition-all">Hủy bỏ</button>\n                        <button onclick="DepartmentController.confirmManagerChange()" class="flex-1 py-3 rounded-xl bg-amber-500 text-white text-[10px] font-[900] uppercase tracking-wider hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all">Đổi quản lý</button>\n                    </div>\n                </div>\n            </div>\n        </div>',
    );
  }
}
new DepartmentController();
