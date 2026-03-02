/**
 * js/services/schedule/leave.js
 */
const LeaveService = {
  openForm: async (defaultDate) => {
    document.getElementById("leave-start").value = defaultDate;
    document.getElementById("leave-end").value = defaultDate;
    document.getElementById("leave-reason").value = "";
    document
      .getElementById("leave-follower-select-box")
      .classList.add("hidden");

    if (typeof selectCustomDropdown === "function")
      selectCustomDropdown("leave-type", "PHÉP NĂM", "Phép năm");

    document.getElementById("leave-manager-label").innerText = "Đang tải...";
    document.getElementById("leave-manager-hidden").value = "";
    document.getElementById("leave-form-modal").classList.remove("hidden");

    const currentUser = JSON.parse(
      localStorage.getItem("current_session_user") || "{}",
    );
    const myDeptId = currentUser.department_id;

    // TẢI SẾP & NHÂN VIÊN SONG SONG ĐỂ ĐỒNG BỘ
    try {
      const [resMgr, resStaff] = await Promise.all([
        Utils.callApi("fetch_managers_for_select", {}),
        Utils.callApi("fetch_all_staff", {}),
      ]);

      // 1. Render CC List trước
      let staffHtml = "";
      if (resStaff.data) {
        resStaff.data.forEach((u) => {
          if (u.id == currentUser.id) return;
          const isBGD =
            u.dept_name && u.dept_name.includes("Giám Đốc") ? "checked" : "";
          const deptName = u.dept_name || u.role_name || "Nhân sự";
          const shortName = Utils.formatShortName(u.fullName);
          const avatarSrc = Utils.getAvatar(u.avatar, u.fullName, 128);

          staffHtml += `
                    <label class="follower-item flex items-center justify-between p-3 mb-2 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:border-indigo-200 hover:shadow-sm transition-all group" data-uid="${u.id}">
                        <input type="checkbox" name="leave_followers[]" value="${u.id}" data-name="${shortName}" onchange="LeaveService.updateFollowerTags()" ${isBGD} class="hidden peer">
                        <div class="flex items-center gap-3 overflow-hidden">
                            <img src="${avatarSrc}" class="w-10 h-10 rounded-full object-cover shadow-sm bg-slate-50 shrink-0 border border-slate-100">
                            <div class="flex flex-col truncate">
                                <span class="user-name font-[900] text-[14px] text-slate-700 truncate group-hover:text-indigo-700 transition-colors">${shortName}</span>
                                <span class="text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md w-max mt-1 border border-slate-100">${deptName}</span>
                            </div>
                        </div>
                        <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all bg-slate-50 text-slate-400 peer-checked:bg-[#5b61f1] peer-checked:text-white border border-slate-200 peer-checked:border-[#5b61f1] shadow-sm">
                            <i data-lucide="plus" width="14"></i>
                        </div>
                    </label>`;
        });
      }
      document.getElementById("leave-followers-list").innerHTML = staffHtml;

      // 2. Render Manager List
      const mgrList = document.getElementById("list-manager-options");
      mgrList.innerHTML = "";
      let initialManagerId = null;

      if (resMgr.data) {
        resMgr.data.forEach((m) => {
          const deptName = m.current_dept_name || "Ban Giám Đốc";
          const avatarSrc = Utils.getAvatar(m.avatar, m.fullName, 128);
          const displayLabel = `${m.fullName} (${deptName})`;

          // [QUAN TRỌNG]: Gắn callback gọi LeaveService.syncManagerAndCC() khi user đổi Sếp
          mgrList.innerHTML += `
                        <div onclick="event.stopPropagation(); selectCustomDropdown('leave-manager', '${m.id}', '${displayLabel}', 'LeaveService.syncManagerAndCC(${m.id})')" 
                             class="p-2 mb-1 rounded-2xl hover:bg-indigo-50 cursor-pointer transition-all flex items-center gap-3 border border-transparent hover:border-indigo-100">
                            <img src="${avatarSrc}" class="w-9 h-9 rounded-full object-cover shadow-sm bg-white shrink-0">
                            <div class="flex flex-col overflow-hidden">
                                <span class="text-sm font-[800] text-slate-800 truncate">${m.fullName}</span>
                                <span class="text-[10px] font-bold text-slate-500">${deptName}</span>
                            </div>
                        </div>`;

          if (m.current_dept_id == myDeptId) {
            initialManagerId = m.id;
            if (typeof selectCustomDropdown === "function")
              selectCustomDropdown("leave-manager", m.id, displayLabel);
          }
        });
      }

      // Đồng bộ ban đầu: Xóa ông Sếp mặc định khỏi list CC
      if (initialManagerId) LeaveService.syncManagerAndCC(initialManagerId);
      else LeaveService.updateFollowerTags();
    } catch (e) {
      console.error(e);
    }

    if (window.lucide) lucide.createIcons();
  },

  // [MỚI] Hàm xử lý giấu Sếp khỏi list CC
  syncManagerAndCC: (managerId) => {
    document.querySelectorAll(".follower-item").forEach((item) => {
      const uid = item.getAttribute("data-uid");
      const checkbox = item.querySelector('input[type="checkbox"]');

      if (uid == managerId) {
        // Nếu item này là Sếp đang chọn -> Ẩn đi và Bỏ tích
        item.classList.add("hidden", "manager-hidden");
        item.classList.remove("flex");
        if (checkbox) checkbox.checked = false;
      } else {
        // Nếu không phải -> Cho phép hiện (Nếu không bị thanh search ẩn)
        item.classList.remove("manager-hidden");
        if (!item.classList.contains("search-hidden")) {
          item.classList.remove("hidden");
          item.classList.add("flex");
        }
      }
    });
    LeaveService.updateFollowerTags();
  },

  searchFollowers: () => {
    const keyword = document
      .getElementById("search-follower-input")
      .value.toLowerCase();
    document.querySelectorAll(".follower-item").forEach((item) => {
      const name = item.querySelector(".user-name").innerText.toLowerCase();

      if (!name.includes(keyword)) {
        item.classList.add("hidden", "search-hidden");
        item.classList.remove("flex");
      } else {
        item.classList.remove("search-hidden");
        // Chỉ hiện nếu người này không phải là Sếp đang bị giấu
        if (!item.classList.contains("manager-hidden")) {
          item.classList.remove("hidden");
          item.classList.add("flex");
        }
      }
    });
  },

  toggleFollowerList: () => {
    document
      .getElementById("leave-follower-select-box")
      .classList.toggle("hidden");
  },

  updateFollowerTags: () => {
    const container = document.getElementById("leave-selected-followers-tags");
    const checkboxes = document.querySelectorAll(
      'input[name="leave_followers[]"]:checked',
    );
    let html = "";
    checkboxes.forEach((cb) => {
      html += `<span class="px-2.5 py-1.5 bg-white shadow-sm text-slate-700 text-[11px] font-bold rounded-lg flex items-center gap-1.5 border border-slate-200 group transition-all hover:border-rose-300">
                        <i data-lucide="user" width="12" class="text-[#5b61f1]"></i> ${cb.getAttribute("data-name")}
                        <i data-lucide="x" width="12" class="text-slate-300 hover:text-rose-500 cursor-pointer ml-1 bg-slate-50 rounded-full p-0.5 transition-colors" onclick="LeaveService.removeFollower('${cb.value}')"></i>
                     </span>`;
    });
    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  },

  removeFollower: (id) => {
    const cb = document.querySelector(
      `input[name="leave_followers[]"][value="${id}"]`,
    );
    if (cb) {
      cb.checked = false;
      LeaveService.updateFollowerTags();
      const itemLabel = cb.closest("label");
      if (itemLabel) itemLabel.classList.remove("peer-checked");
    }
  },

  closeForm: () =>
    document.getElementById("leave-form-modal").classList.add("hidden"),

  submitForm: async (e) => {
    e.preventDefault();
    const start = document.getElementById("leave-start").value;
    const end = document.getElementById("leave-end").value;
    const reason = document.getElementById("leave-reason").value;
    const leaveType = document.getElementById("leave-type-hidden").value;
    const managerId = document.getElementById("leave-manager-hidden").value;

    if (!managerId)
      return Utils.showToast("Vui lòng chọn người duyệt!", "error");
    if (new Date(start) > new Date(end))
      return Utils.showToast("Ngày bắt đầu không được lớn kết thúc!", "error");

    const followers = Array.from(
      document.querySelectorAll('input[name="leave_followers[]"]:checked'),
    ).map((cb) => cb.value);

    Utils.showToast("Đang gửi đơn...", "info");
    const res = await Utils.callApi("create_leave_request", {
      start_date: start,
      end_date: end,
      reason: reason,
      leave_type: leaveType,
      manager_id: managerId,
      followers: followers,
    });

    if (res && res.status === "success") {
      Utils.showToast(res.message, "success");
      LeaveService.closeForm();
      if (typeof ScheduleController !== "undefined")
        ScheduleController.renderCalendar();
    }
  },
};
