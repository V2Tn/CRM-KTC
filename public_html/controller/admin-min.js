import staffService from "../service/admin/staff-min.js";
import deptService from "../service/admin/department-min.js";
class AdminController {
  constructor() {
    ((this.staffCache = []),
      (this.deptCache = []),
      (this.managersCache = []),
      (this.currentDeptMembers = []),
      (this.availableUsers = []),
      (window.AdminController = this),
      (this.pendingDeleteItem = null),
      this._injectDeleteModal(),
      this.init());
  }
  init() {
    const e =
      "MANAGER" ===
      JSON.parse(localStorage.getItem("current_session_user") || "{}").role;
    if (
      (document.getElementById("staff-list-container") &&
        (this.loadDepartmentsToSelect().then(() => {
          this.loadStaffList();
        }),
        this.loadRolesToSelect()),
      document.getElementById("department-list-container"))
    ) {
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
  selectCustomOption(e, t, n) {
    const s = document.getElementById(`label-${e}-selected`),
      a = document.getElementById(`staff-${e}-hidden-val`),
      i = document.getElementById(`${e}-dropdown`);
    (s && (s.innerText = n),
      a && (a.value = t),
      i && i.classList.add("hidden"));
    const l = i?.previousElementSibling?.querySelector(
      '[data-lucide="chevron-down"]',
    );
    l && (l.style.transform = "rotate(0deg)");
  }
  selectDeptManager(e, t) {
    const n = document.getElementById("label-manager-selected"),
      s = document.getElementById("dept-manager-hidden-val"),
      a = document.getElementById("manager-dropdown");
    (n && (n.innerText = t),
      s && (s.value = e),
      a && a.classList.add("hidden"));
    const i = a?.previousElementSibling?.querySelector(
      '[data-lucide="chevron-down"]',
    );
    (i && (i.style.transform = "rotate(0deg)"), this.checkManagerConflict(e));
  }
  async openDeptModal(e = null) {
    const t = document.getElementById("dept-form-modal"),
      n = document.getElementById("dept-form"),
      s = document.getElementById("dept-id"),
      a = document.getElementById("dept-modal-title"),
      i = JSON.parse(localStorage.getItem("current_session_user") || "{}"),
      l = "MANAGER" === i.role;
    if (!t || !n) return;
    (n.reset(),
      document.getElementById("manager-warning")?.classList.add("hidden"),
      document
        .getElementById("btn-manager-select")
        ?.classList.remove("border-rose-500", "bg-rose-50"));
    const r = document.getElementById("btn-delete-dept-modal");
    (r && (l ? r.classList.add("hidden") : r.classList.remove("hidden")),
      l || (await this.loadManagersToSelect()));
    const d = await staffService.getAvailableUsers();
    if (((this.availableUsers = "success" === d.status ? d.data : []), e)) {
      const t = this.deptCache.find((t) => t.id == e);
      if (t) {
        (a && (a.innerText = t.name),
          s && (s.value = t.id),
          n.elements.name && (n.elements.name.value = t.name),
          n.elements.description &&
            (n.elements.description.value = t.description || ""));
        const r = t.managerId || "";
        let d = "-- Chọn quản lý --";
        if (l) {
          d = i.fullName + " (Tôi)";
          const e = document.getElementById("btn-manager-select");
          e &&
            (e.classList.add(
              "pointer-events-none",
              "opacity-60",
              "bg-slate-100",
            ),
            (e.onclick = null));
        } else {
          if (r) {
            const e = this.managersCache.find((e) => e.id == r);
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
              "AdminController.toggleDropdown('manager-dropdown')",
            ));
        }
        this.selectDeptManager(r, d);
        const o = await staffService.getMembersByDept(e);
        this.currentDeptMembers = "success" === o.status ? o.data : [];
      }
    } else
      (a && (a.innerText = "THÊM PHÒNG BAN"),
        s && (s.value = ""),
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
        "<div class=\"p-3 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-50 cursor-pointer transition-all\" \n                        onclick=\"AdminController.selectDeptManager('', '-- Chọn quản lý --')\">-- Bỏ chọn --</div>";
      (t.data.forEach((e) => {
        n += `<div class="p-3 rounded-xl text-xs font-[800] text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-all flex justify-between items-center" \n                        onclick="AdminController.selectDeptManager('${e.id}', '${e.fullName}')">\n                            <span>${e.fullName}</span>\n                            <span class="text-[9px] text-slate-300 font-normal">@${e.username}</span>\n                        </div>`;
      }),
        (e.innerHTML = n));
    }
  }
  checkManagerConflict(e) {
    const t = document.getElementById("btn-manager-select"),
      n = document.getElementById("manager-warning"),
      s = document.getElementById("manager-warning-text"),
      a = document.getElementById("dept-id").value;
    if (!t || !n) return;
    if (!e)
      return (
        n.classList.add("hidden"),
        void t.classList.remove("border-rose-500", "bg-rose-50")
      );
    const i = this.managersCache.find((t) => t.id == e);
    i && i.current_dept_id && i.current_dept_id != a
      ? ((s.innerText = `${i.username} đang quản lý ${i.current_dept_name}`),
        n.classList.remove("hidden"),
        window.Utils.showToast(
          `Cảnh báo: ${i.fullName} đang quản lý phòng khác!`,
          "error",
        ),
        t.classList.add("border-rose-500", "bg-rose-50"))
      : (n.classList.add("hidden"),
        t.classList.remove("border-rose-500", "bg-rose-50"));
  }
  async saveDept(e) {
    e.preventDefault();
    const t = e.target,
      n = this.currentDeptMembers.map((e) => e.id),
      s = {
        id: t.id.value,
        name: t.name.value.trim(),
        description: t.description.value.trim(),
        manager_id: document.getElementById("dept-manager-hidden-val").value,
        members: n,
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
          this.loadStaffList(),
          this.loadDepartmentsToSelect())
        : alert("Lỗi: " + e.message);
    } catch (e) {
      alert("Lỗi kết nối Server");
    } finally {
      this._toggleBtnLoading("btn-save-dept", !1, "LƯU THAY ĐỔI");
    }
  }
  deleteDept(e, t) {
    this.openDeleteModal("dept", e, t);
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
    let n = "";
    (e.forEach((e) => {
      const t = 1 == e.active,
        s = t ? "bg-[#dcfce7] text-[#166534]" : "bg-slate-100 text-slate-400",
        a = t ? "ĐANG HOẠT ĐỘNG" : "TẠM KHÓA",
        i = e.role_name ? e.role_name.toUpperCase() : e.role || "MEMBER";
      let l = e.dept_name;
      if (!l && e.department && 0 != e.department) {
        const t = this.deptCache.find((t) => t.id == e.department);
        l = t ? t.name : "ID: " + e.department;
      }
      l =
        l && "0" != l && 0 != e.department
          ? l.toUpperCase()
          : "CHƯA PHÂN PHÒNG";
      const r = e.avatar
        ? e.avatar
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(e.fullName)}&background=random&size=128`;
      n += `\n            <div class="bg-white rounded-[32px] p-8 border border-slate-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">\n                <div class="flex items-start gap-5 mb-8">\n                    <img src="${r}" class="w-16 h-16 rounded-[24px] object-cover border border-slate-100 shrink-0 shadow-sm bg-slate-50">\n                    \n                    <div class="pt-1">\n                        <h3 class="font-[900] text-[17px] text-slate-900 leading-tight mb-1.5 line-clamp-1">${e.fullName}</h3>\n                        <div class="flex items-center gap-2 text-[10px] font-black tracking-widest">\n                             <span class="text-indigo-600 whitespace-nowrap">${l}</span>\n                             <span class="text-slate-300">•</span>\n                             <span class="text-slate-400">${i}</span>\n                        </div>\n                    </div>\n                </div>\n                <div class="space-y-3 mb-8 flex-1 pl-1">\n                    <div class="flex items-center gap-3 text-[13px] font-bold text-slate-500"><i data-lucide="mail" width="16" class="text-slate-300 shrink-0"></i><span class="truncate">${e.email || "N/A"}</span></div>\n                    <div class="flex items-center gap-3 text-[13px] font-bold text-slate-500"><i data-lucide="phone" width="16" class="text-slate-300 shrink-0"></i><span>${e.phone || "N/A"}</span></div>\n                </div>\n                <div class="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto">\n                    <span class="px-4 py-2 rounded-xl text-[9px] font-[900] uppercase tracking-widest ${s}">${a}</span>\n                    <div class="flex gap-2">\n                         <button onclick="AdminController.openStaffModal(${e.id})" class="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all"><i data-lucide="edit-3" width="18"></i></button>\n                         ${1 != e.id ? `<button onclick="AdminController.deleteStaff(${e.id})" class="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all"><i data-lucide="trash-2" width="18"></i></button>` : ""}\n                    </div>\n                </div>\n            </div>`;
    }),
      (t.innerHTML = n),
      window.lucide && lucide.createIcons());
  }
  async saveStaff(e) {
    e.preventDefault();
    const t = e.target,
      n = {
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
    if (!n.fullName || !n.username)
      return window.Utils.showToast("Vui lòng điền tên và tài khoản", "error");
    this._toggleBtnLoading("btn-save-staff", !0, "ĐANG XỬ LÝ...");
    try {
      const e = n.id
        ? await staffService.update(n)
        : await staffService.create(n);
      "success" === e.status
        ? (window.Utils &&
            window.Utils.showToast(
              n.id ? "Đã cập nhật!" : "Đã thêm mới!",
              "success",
            ),
          this.closeModal(),
          await this.loadStaffList())
        : alert("Lỗi: " + e.message);
    } catch (e) {
      alert("Lỗi kết nối Server");
    } finally {
      this._toggleBtnLoading(
        "btn-save-staff",
        !1,
        n.id ? "CẬP NHẬT" : "LƯU THÔNG TIN",
      );
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
    let s = "";
    (e.forEach((e) => {
      const t = n
        ? ""
        : `<button onclick="AdminController.deleteDept(${e.id}, '${e.name}')" class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all"><i data-lucide="trash-2" width="16"></i></button>`;
      s += `<div class="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full relative overflow-hidden"><div class="absolute -right-6 -top-6 w-24 h-24 bg-slate-50 rounded-full group-hover:bg-indigo-50 transition-colors duration-500"></div><div class="relative z-10"><div class="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"><i data-lucide="briefcase" width="24"></i></div><h3 class="font-[900] text-lg text-slate-800 uppercase tracking-tight mb-2">${e.name}</h3><p class="text-xs font-bold text-slate-400 mb-8 line-clamp-2 h-8">${e.description || "..."}</p><div class="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto"><div class="px-4 py-2 bg-[#eff6ff] text-indigo-600 rounded-xl text-[10px] font-[900] uppercase tracking-widest flex items-center gap-2"><i data-lucide="users" width="12"></i><span>${e.staff_count || 0} NHÂN VIÊN</span></div><div class="flex gap-2"><button onclick="AdminController.openDeptModal(${e.id})" class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all"><i data-lucide="edit-3" width="16"></i></button>${t}</div></div></div></div>`;
    }),
      (t.innerHTML = s),
      window.lucide && lucide.createIcons());
  }
  async loadDepartmentsToSelect() {
    const e = await deptService.getAll();
    if ("success" === e.status && e.data) {
      this.deptCache = e.data;
      const t = document.getElementById("list-dept-options");
      if (!t) return;
      let n =
        "<div class=\"p-3 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-50 cursor-pointer\" onclick=\"AdminController.selectCustomOption('dept', '', 'CHƯA PHÂN PHÒNG')\">CHƯA PHÂN PHÒNG</div>";
      (e.data.forEach((e) => {
        n += `<div class="p-3 rounded-xl text-xs font-[800] text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-all uppercase" onclick="AdminController.selectCustomOption('dept', '${e.id}', '${e.name}')">${e.name}</div>`;
      }),
        (t.innerHTML = n));
    }
  }
  async loadRolesToSelect() {
    const e = await staffService.getRoles();
    if ("success" === e.status && e.data) {
      const t = document.getElementById("list-role-options");
      if (!t) return;
      let n = "";
      (e.data.forEach((e) => {
        const t = (e.name || e.role_name).toUpperCase();
        n += `<div class="p-3 rounded-xl text-xs font-[800] text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-all" onclick="AdminController.selectCustomOption('role', '${e.code || e.id}', '${t}')">${t}</div>`;
      }),
        (t.innerHTML = n));
    }
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
      n += `\n            <div class="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between group shadow-sm">\n                <div class="flex items-center gap-3">\n                    <img src="${t}" class="w-8 h-8 rounded-lg object-cover border border-slate-100 shadow-sm">\n                    <div><p class="text-xs font-bold text-slate-700">${e.fullName}</p></div>\n                </div>\n                <button onclick="AdminController.removeMemberFromDept(${e.id})" class="text-slate-300 hover:text-rose-500 p-1"><i data-lucide="minus-circle" width="16"></i></button>\n            </div>`;
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
      s = this.availableUsers.filter(
        (e) => e.fullName.toLowerCase().includes(t) && !n.includes(e.id),
      );
    let a = "";
    (0 === s.length
      ? (a =
          '<div class="text-center text-slate-300 text-xs py-10">Không tìm thấy nhân viên phù hợp</div>')
      : s.forEach((e) => {
          const t = e.current_dept_name
              ? `<span class="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">${e.current_dept_name}</span>`
              : '<span class="text-[9px] text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded ml-1">Tự do</span>',
            n = e.avatar
              ? e.avatar
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(e.fullName)}&background=random&size=64`;
          a += `\n                <div class="bg-white p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-sm cursor-pointer transition-all flex items-center justify-between group mb-2" onclick="AdminController.addMemberToDept(${e.id})">\n                    <div class="flex items-center gap-3 overflow-hidden">\n                        <img src="${n}" class="w-8 h-8 rounded-full object-cover border border-slate-100 shrink-0">\n                        <div class="truncate">\n                            <p class="text-xs font-bold text-slate-700 group-hover:text-indigo-700 transition-colors truncate">${e.fullName}</p>\n                            <div class="flex items-center gap-1">${t}</div>\n                        </div>\n                    </div>\n                    <div class="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-500 group-hover:text-white transition-all"><i data-lucide="plus" width="14"></i></div>\n                </div>`;
        }),
      (e.innerHTML = a),
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
  deleteStaff(e, t) {
    this.openDeleteModal("staff", e, t);
  }
  closeModal() {
    document.getElementById("staff-form-modal")?.classList.add("hidden");
  }
  openStaffModal(e = null) {
    const t = document.getElementById("staff-form-modal"),
      n = document.getElementById("staff-form"),
      s = document.getElementById("staff-id"),
      a = document.getElementById("modal-title"),
      i = document.getElementById("staff-modal-avatar-preview");
    if (t && n) {
      if ((n.reset(), e)) {
        a.innerText = "CẬP NHẬT NHÂN SỰ";
        const t = this.staffCache.find((t) => t.id == e);
        if (t) {
          ((s.value = t.id),
            (n.elements.fullName.value = t.fullName),
            (n.elements.username.value = t.username),
            (n.elements.email.value = t.email || ""),
            (n.elements.phone.value = t.phone || ""),
            i &&
              (i.src = t.avatar
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
            (n.elements.active.checked = 1 == t.active),
            (n.elements.password.placeholder = "Để trống nếu không đổi"));
        }
      } else
        ((a.innerText = "THÊM NHÂN SỰ MỚI"),
          (s.value = ""),
          i && (i.src = "https://via.placeholder.com/128?text=USER"),
          this.selectCustomOption("dept", "", "-- Chọn phòng ban --"),
          this.selectCustomOption("role", "STAFF", "NHÂN VIÊN"),
          (n.elements.active.checked = !0),
          (n.elements.password.placeholder = "••••••"));
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
  _toggleBtnLoading(e, t, n) {
    window.Utils && window.Utils.toggleLoading(e, t, n);
  }
  _injectDeleteModal() {
    if (document.getElementById("custom-delete-modal")) return;
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div id="custom-delete-modal" class="fixed inset-0 z-[9999] hidden flex items-center justify-center transition-all duration-200 opacity-0 pointer-events-none"><div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onclick="AdminController.closeDeleteModal()"></div><div class="bg-white rounded-[24px] p-6 w-[90%] max-w-sm shadow-2xl relative z-10 transform scale-95 transition-all duration-200"><div class="flex flex-col items-center text-center"><div class="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4 shadow-sm shadow-rose-100"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><h3 class="text-lg font-[900] text-slate-800 mb-2 uppercase tracking-tight">Xác nhận xóa?</h3><p class="text-slate-500 text-xs font-medium mb-6 leading-relaxed">Bạn đang chuẩn bị xóa <span id="del-item-name" class="font-bold text-slate-800">mục này</span>.<br>Hành động này <span class="text-rose-500 font-bold">không thể hoàn tác</span>!</p><div class="flex gap-3 w-full"><button onclick="AdminController.closeDeleteModal()" class="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-[900] uppercase tracking-wider hover:bg-slate-200 transition-all">Hủy bỏ</button><button onclick="AdminController.executeDelete()" id="btn-confirm-delete" class="flex-1 py-3 rounded-xl bg-rose-500 text-white text-xs font-[900] uppercase tracking-wider hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all">Xóa ngay</button></div></div></div></div>',
    );
  }
  openDeleteModal(e, t, n = "mục này") {
    this.pendingDeleteItem = { type: e, id: t };
    const s = document.getElementById("custom-delete-modal"),
      a = document.getElementById("del-item-name");
    s &&
      a &&
      ((a.innerText = "staff" === e ? `nhân viên "${n}"` : `phòng ban "${n}"`),
      s.classList.remove("hidden", "pointer-events-none"),
      setTimeout(() => {
        (s.classList.remove("opacity-0"),
          s.querySelector("div.transform").classList.remove("scale-95"),
          s.querySelector("div.transform").classList.add("scale-100"));
      }, 10));
  }
  closeDeleteModal() {
    this.pendingDeleteItem = null;
    const e = document.getElementById("custom-delete-modal");
    e &&
      (e.classList.add("opacity-0"),
      e.querySelector("div.transform").classList.remove("scale-100"),
      e.querySelector("div.transform").classList.add("scale-95"),
      setTimeout(() => e.classList.add("hidden", "pointer-events-none"), 200));
  }
  async executeDelete() {
    if (!this.pendingDeleteItem) return;
    const { type: e, id: t } = this.pendingDeleteItem,
      n = document.getElementById("btn-confirm-delete"),
      s = n.innerText;
    let a;
    ((n.innerText = "Đang xóa..."),
      (n.disabled = !0),
      "staff" === e
        ? (a = await staffService.delete(t))
        : "dept" === e && (a = await deptService.delete(t)),
      (n.innerText = s),
      (n.disabled = !1),
      this.closeDeleteModal(),
      a && "success" === a.status
        ? (window.Utils.showToast("Đã xóa thành công!", "success"),
          "staff" === e
            ? this.loadStaffList()
            : (this.loadDepartmentList(), this.loadDepartmentsToSelect()))
        : window.Utils.showToast(
            a ? a.message : "Lỗi không xác định",
            "error",
          ));
  }
}
new AdminController();
