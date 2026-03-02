/**
 * public_html/js/team.js
 *
 */
console.log("✅ TeamController đã tải!");

const TeamController = {
  state: {
    currentView: "departments",
    filterDays: 0,
    rawData: null,
    selectedDeptId: null,
    selectedUserId: null,
    role: null,
    myId: null,
    currentMemberTasks: [],
    currentMemberInfo: null,
    activeStatusFilter: "all",
    currentPage: 1,
    itemsPerPage: 10,
  },

  init: () => {
    const user = JSON.parse(
      localStorage.getItem("current_session_user") || "{}",
    );
    TeamController.state.role = user.role || "STAFF";
    TeamController.state.myId = user.id;

    if (TeamController.state.role === "MANAGER") {
      TeamController.state.currentView = "dept-detail";
      const totalStats = document.getElementById("view-total-stats");
      if (totalStats) totalStats.classList.add("hidden");
    }
    const filterEl = document.getElementById("team-date-filter");
    if (filterEl) filterEl.value = "0";

    TeamController.loadData();
  },

  loadData: async () => {
    TeamController.state.filterDays =
      document.getElementById("team-date-filter").value;
    const res = await Utils.callApi("fetch_team_stats", {
      days: TeamController.state.filterDays,
    });

    if (res.status === "success") {
      TeamController.state.rawData = res.data;
      if (
        res.totalStats &&
        TeamController.state.currentView === "departments"
      ) {
        TeamDeptService.renderTotalStats(res.totalStats); // Gọi Service
      }

      if (TeamController.state.currentView === "dept-detail") {
        if (TeamController.state.role === "MANAGER") {
          TeamDeptDetailService.render(res.data, "Phòng ban của tôi"); // Gọi Service
        } else if (TeamController.state.selectedDeptId) {
          const dept = res.data.find(
            (d) => d.id == TeamController.state.selectedDeptId,
          );
          if (dept) TeamDeptDetailService.render(dept.members, dept.name); // Gọi Service
        }
      } else if (TeamController.state.currentView === "departments") {
        TeamDeptService.renderDepartmentsList(res.data); // Gọi Service
        TeamDeptService.renderDepartmentChart(res.data); // Gọi Service
      }
    }
  },

  // --- ĐIỀU HƯỚNG ---
  openDepartment: (deptId) => {
    TeamController.state.selectedDeptId = deptId;
    TeamController.state.currentView = "dept-detail";

    document.getElementById("view-total-stats")?.classList.add("hidden");
    document.getElementById("view-department-chart")?.classList.add("hidden");
    document
      .getElementById("team-date-filter")
      ?.parentElement.classList.remove("hidden");

    if (!TeamController.state.rawData) return;
    const deptData = TeamController.state.rawData.find((d) => d.id == deptId);
    if (deptData) {
      TeamDeptDetailService.render(deptData.members, deptData.name); // Gọi Service
      setTimeout(() => {
        const y =
          document.getElementById("view-dept-detail").getBoundingClientRect()
            .top +
          window.scrollY -
          100;
        window.scrollTo({ top: y, behavior: "smooth" });
      }, 50);
    }
  },

  openMember: (userId) => {
    TeamController.state.selectedUserId = userId;
    TeamController.state.currentView = "member-detail";

    document.getElementById("view-departments").classList.add("hidden");
    document.getElementById("view-dept-detail").classList.add("hidden");
    document.getElementById("view-member-detail").classList.remove("hidden");
    document.getElementById("btn-team-back")?.classList.remove("hidden");
    document
      .getElementById("team-date-filter")
      ?.parentElement.classList.add("hidden");

    TeamController.loadMemberTasks(userId);
  },

  goBack: () => {
    const totalStats = document.getElementById("view-total-stats");
    const dateFilter = document.getElementById("team-date-filter");
    const chartWrapper = document.getElementById("view-department-chart");

    if (TeamController.state.currentView === "member-detail") {
      TeamController.state.currentView = "dept-detail";
      document.getElementById("view-member-detail").classList.add("hidden");
      document.getElementById("view-dept-detail").classList.remove("hidden");
      if (dateFilter && dateFilter.parentElement)
        dateFilter.parentElement.classList.remove("hidden");

      if (TeamController.state.role === "MANAGER") {
        document.getElementById("btn-team-back").classList.add("hidden");
        document.getElementById("team-page-title").innerText =
          "PHÒNG BAN CỦA TÔI";
      } else {
        const dept = TeamController.state.rawData.find(
          (d) => d.id == TeamController.state.selectedDeptId,
        );
        if (dept)
          document.getElementById("team-page-title").innerText =
            dept.name.toUpperCase();
      }
    } else if (TeamController.state.currentView === "dept-detail") {
      TeamController.state.currentView = "departments";
      document.getElementById("view-dept-detail").classList.add("hidden");
      document.getElementById("view-departments").classList.remove("hidden");
      document.getElementById("btn-team-back").classList.add("hidden");
      if (totalStats) totalStats.classList.remove("hidden");
      if (dateFilter && dateFilter.parentElement)
        dateFilter.parentElement.classList.remove("hidden");

      if (chartWrapper) chartWrapper.classList.remove("hidden");
      if (TeamController.state.rawData)
        TeamDeptService.renderDepartmentChart(TeamController.state.rawData);

      document.getElementById("team-page-title").innerText =
        "TỔNG QUAN ĐỘI NHÓM";
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  // --- MODULE ĐÁNH GIÁ (GIỮ NGUYÊN) ---
  openRatingModal: (staffId, staffName, preSelectType = "LIKE") => {
    // [Logic modal cũ]
    const modal = document.getElementById("rating-modal");
    if (!modal) return;
    document.getElementById("rating-staff-id").value = staffId;
    document.getElementById("rating-staff-name").innerText = staffName;
    document.getElementById("rating-avatar-preview").innerText =
      staffName.charAt(0);
    document.getElementById("rating-note").value = "";
    const radios = document.getElementsByName("rating_type");
    radios.forEach((r) => (r.checked = r.value === preSelectType));
    modal.classList.remove("hidden");
    if (window.lucide) lucide.createIcons();
  },

  closeRatingModal: () => {
    document.getElementById("rating-modal")?.classList.add("hidden");
  },

  submitRating: async (event) => {
    event.preventDefault();
    const staffId = document.getElementById("rating-staff-id").value;
    const type = document.querySelector(
      'input[name="rating_type"]:checked',
    ).value;
    const note = document.getElementById("rating-note").value.trim();
    if (!note) return Utils.showToast("Vui lòng nhập lý do đánh giá!", "error");

    const res = await Utils.callApi("evaluate_staff", {
      staff_id: staffId,
      type: type,
      note: note,
    });
    if (res.status === "success") {
      Utils.showToast(`Đã đánh giá thành công!`, "success");
      TeamController.closeRatingModal();
      await TeamController.loadData();
    } else {
      Utils.showToast(res.message, "error");
    }
  },

  // --- XỬ LÝ TASK CỦA MEMBER ---
  loadMemberTasks: async (userId) => {
    document.getElementById("view-member-detail").innerHTML =
      '<div class="py-32 flex flex-col items-center justify-center text-slate-300"><i data-lucide="loader-2" width="40" class="animate-spin mb-4"></i><span class="text-xs font-bold uppercase tracking-widest">Đang tải...</span></div>';
    const res = await Utils.callApi("fetch_member_tasks", {
      user_id: userId,
      days: TeamController.state.filterDays,
    });
    if (res.status === "success") {
      TeamController.state.currentMemberTasks = res.tasks;
      TeamController.state.currentMemberInfo = res.user;
      TeamController.state.activeStatusFilter = "all";
      TeamController.state.currentPage = 1;
      TeamMemberDetailService.render(); // Gọi Service
    }
  },

  changeFilter: () => {
    if (TeamController.state.currentView === "member-detail")
      TeamController.loadMemberTasks(TeamController.state.selectedUserId);
    else TeamController.loadData();
  },

  filterMemberTasks: (status) => {
    TeamController.state.activeStatusFilter = status;
    TeamController.state.currentPage = 1;
    TeamMemberDetailService.render(); // Gọi Service
  },

  changePage: (newPage) => {
    TeamController.state.currentPage = newPage;
    TeamMemberDetailService.render(); // Gọi Service
  },
};
window.TeamController = TeamController;
