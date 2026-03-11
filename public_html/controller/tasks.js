/**
 * controller/tasks.js
 * FINAL VERSION: Member Picker Integration, Drag & Drop (newQuadrant),
 * Fixed Sticky Assignee ID, Fireworks Celebration, and Null Safety.
 */
import taskService from "../service/task/task-min.js";

class TasksController {
  constructor() {
    this.staffList = [];
    window.TaskController = this;
  }

  async _callApi(action, params = {}) {
    try {
      const response = await fetch("api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...params }),
      });
      return await response.json();
    } catch (error) {
      return { status: "error", message: "Lỗi kết nối" };
    }
  }

  async init() {
    const form = document.getElementById("createTaskForm");
    if (form) {
      // Clone form để reset event listener tránh lặp sự kiện
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);

      newForm.addEventListener("submit", (e) => this.handleCreateTask(e));
      this.setFormTimeDefaults(newForm);

      // Khởi tạo logic Member Picker (Giao việc)
      this.setupAssigneeToggle(newForm);
    }

    const user = this.getCurrentUser();
    if (user) {
      await this.loadTasks();
    }

    // Khởi tạo vùng hứng kéo thả
    this.initDragAndDrop();
  }

  // ==========================================
  // LOGIC MEMBER PICKER (GIAO VIỆC)
  // ==========================================

  setupAssigneeToggle(form) {
    const assignToggleBtn = form.querySelector("#assign-toggle-btn");
    const assigneeSection = form.querySelector("#assigneeSection");
    const listContainer = form.querySelector("#assignee-list-container");
    const searchInput = form.querySelector("#search-assignee");
    const idInput = form.querySelector("#selected-assignee-id");
    const user = this.getCurrentUser();

    // Mặc định là tự giao cho chính mình
    if (idInput) idInput.value = user.id;

    // Nếu là tài khoản STAFF (Không có nút giao việc) -> Dừng ở đây
    if (!assignToggleBtn) return;

    // Khởi tạo UI mặc định
    this.updateAssigneeDisplay(user.id);

    assignToggleBtn.onclick = async () => {
      const isHidden = assigneeSection.classList.contains("hidden");
      const icon = document.getElementById("assign-toggle-icon");

      if (isHidden) {
        assigneeSection.classList.remove("hidden");
        if (icon) icon.style.transform = "rotate(180deg)";

        // Load dữ liệu nhân viên
        if (this.staffList.length === 0) {
          const res = await this._callApi("fetch_assignable_users");
          if (res.status === "success") {
            this.staffList = res.data;
            this.renderAssigneeList(this.staffList, listContainer, idInput);
          }
        } else {
          this.renderAssigneeList(this.staffList, listContainer, idInput);
        }
      } else {
        assigneeSection.classList.add("hidden");
        if (icon) icon.style.transform = "rotate(0deg)";
      }
    };

    // Tìm kiếm
    if (searchInput) {
      searchInput.oninput = () => {
        const term = searchInput.value.toLowerCase();
        const filtered = this.staffList.filter((s) =>
          s.fullName.toLowerCase().includes(term),
        );
        this.renderAssigneeList(filtered, listContainer, idInput);
      };
    }

    document.addEventListener("click", (e) => {
      if (
        assigneeSection &&
        !assigneeSection.classList.contains("hidden") &&
        !e.target.closest("#assign-toggle-wrapper")
      ) {
        assigneeSection.classList.add("hidden");
        const icon = document.getElementById("assign-toggle-icon");
        if (icon) icon.style.transform = "rotate(0deg)";
      }
    });
  }

  renderAssigneeList(list, container, idInput) {
    if (!container || !idInput) return;
    const currentSelectedId = idInput.value;

    if (list.length === 0) {
      container.innerHTML =
        '<div class="text-center py-6 text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Không tìm thấy nhân viên</div>';
      return;
    }

    container.innerHTML = list
      .map((s) => {
        const isSelected = s.id == currentSelectedId;
        const shortName = Utils.formatShortName(s.fullName);
        const avatarSrc = Utils.getAvatar(s.avatar, s.fullName, 128);
        const deptName = s.dept_name || "Nhân sự";

        return `
            <div onclick="TaskController.selectAssignee(${s.id})" 
                 class="flex items-center justify-between p-2.5 rounded-2xl border-2 transition-all cursor-pointer group mb-1
                        ${isSelected ? "border-indigo-500 bg-indigo-50 shadow-sm" : "border-transparent bg-white hover:bg-slate-50 hover:border-indigo-100"}">
                <div class="flex items-center gap-3 min-w-0">
                    <img src="${avatarSrc}" class="w-9 h-9 rounded-full object-cover shadow-sm bg-white shrink-0 border border-slate-100">
                    <div class="truncate">
                        <p class="text-[13px] font-[900] truncate leading-tight ${isSelected ? "text-indigo-700" : "text-slate-700"}">${shortName}</p>
                        <span class="text-[9px] font-bold text-slate-400 uppercase bg-white px-1.5 py-0.5 rounded-md border border-slate-100 inline-block mt-1">${deptName}</span>
                    </div>
                </div>
                <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all border
                            ${isSelected ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-slate-50 text-slate-300 border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-400 group-hover:border-indigo-100"}">
                    <i data-lucide="${isSelected ? "check" : "plus"}" width="12" class="${isSelected ? "stroke-[3]" : ""}"></i>
                </div>
            </div>`;
      })
      .join("");

    if (window.lucide) lucide.createIcons();
  }

  selectAssignee(id) {
    const idInput = document.getElementById("selected-assignee-id");
    const section = document.getElementById("assigneeSection");
    const icon = document.getElementById("assign-toggle-icon");

    if (idInput) {
      idInput.value = id; // Cập nhật ID
      this.updateAssigneeDisplay(id);
      if (section) section.classList.add("hidden");
      if (icon) icon.style.transform = "rotate(0deg)";
    }
  }

  updateAssigneeDisplay(id) {
    const btnContainer = document.getElementById("assign-toggle-btn");
    if (!btnContainer) return;
    const user = this.getCurrentUser();

    if (id == user.id) {
      btnContainer.className =
        "flex items-center justify-between p-3.5 rounded-2xl border-2 border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 cursor-pointer transition-all group";
      btnContainer.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-white group-hover:border-indigo-400 transition-colors">
                        <i data-lucide="user-plus" class="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors"></i>
                    </div>
                    <span class="text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Giao việc cho người khác</span>
                </div>
                <i data-lucide="chevron-down" class="text-slate-400 transition-transform" id="assign-toggle-icon" width="16"></i>
            `;
    } else {
      const selectedUser = this.staffList.find((u) => u.id == id);
      if (selectedUser) {
        const shortName = Utils.formatShortName(selectedUser.fullName);
        const avatarSrc = Utils.getAvatar(
          selectedUser.avatar,
          selectedUser.fullName,
          128,
        );
        const deptName = selectedUser.dept_name || "Nhân sự";

        btnContainer.className =
          "flex items-center justify-between p-2.5 rounded-2xl border-2 border-indigo-500 bg-indigo-50/50 cursor-pointer transition-all shadow-sm";
        btnContainer.innerHTML = `
                    <div class="flex items-center gap-3">
                        <img src="${avatarSrc}" class="w-10 h-10 rounded-full object-cover shadow-sm bg-white border border-indigo-100">
                        <div class="flex flex-col text-left">
                            <span class="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Giao việc cho</span>
                            <span class="text-sm font-[900] text-indigo-700 leading-none">${shortName} <span class="text-[9px] text-slate-500 ml-1 bg-white px-1.5 py-0.5 rounded border border-slate-200">${deptName}</span></span>
                        </div>
                    </div>
                    <div class="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all cursor-pointer shadow-sm" onclick="event.stopPropagation(); TaskController.clearAssignee()">
                        <i data-lucide="x" width="14"></i>
                    </div>
                    <i data-lucide="chevron-down" class="hidden" id="assign-toggle-icon"></i>
                `;
      }
    }
    if (window.lucide) lucide.createIcons();
  }

  clearAssignee() {
    const user = this.getCurrentUser();
    const idInput = document.getElementById("selected-assignee-id");
    if (idInput) idInput.value = user.id; // Trả về cho mình

    this.updateAssigneeDisplay(user.id); // Reset giao diện

    // Reset lại list checkbox bên trong
    const listContainer = document.getElementById("assignee-list-container");
    if (listContainer && this.staffList.length > 0) {
      this.renderAssigneeList(this.staffList, listContainer, idInput);
    }
  }

  // ==========================================
  // LOGIC KÉO THẢ (DRAG & DROP)
  // ==========================================

  initDragAndDrop() {
    ["do_first", "schedule", "delegate", "eliminate"].forEach((q) => {
      const el = document.getElementById(`list-${q}`);
      if (el) {
        el.ondragover = (e) => e.preventDefault();
        el.ondragenter = () => el.classList.add("bg-slate-100/50");
        el.ondragleave = () => el.classList.remove("bg-slate-100/50");
        el.ondrop = (e) => this.handleDrop(e, q);
      }
    });
  }

  handleDragStart(e, taskId) {
    e.dataTransfer.setData("text/plain", taskId);
    const card = document.getElementById(`task-card-${taskId}`);
    if (card) {
      setTimeout(() => card.classList.add("opacity-40"), 0);
    }
  }

  async handleDrop(e, targetQuadrant) {
    e.preventDefault();
    const listEl = document.getElementById(`list-${targetQuadrant}`);
    if (listEl) listEl.classList.remove("bg-slate-100/50");

    const taskId = e.dataTransfer.getData("text/plain");
    const taskEl = document.getElementById(`task-card-${taskId}`);

    if (taskEl) {
      taskEl.classList.remove("opacity-40");
      const res = await this._callApi("update_task_quadrant", {
        id: taskId,
        newQuadrant: targetQuadrant,
      });

      if (res.status === "success") {
        if (window.Utils)
          window.Utils.showToast("Đã di chuyển công việc!", "success");
        await this.loadTasks();
      } else {
        if (window.Utils)
          window.Utils.showToast("Lỗi di chuyển: " + res.message, "error");
        await this.loadTasks();
      }
    }
  }

  // ==========================================
  // TẠO VÀ CẬP NHẬT TRẠNG THÁI
  // ==========================================

  async handleCreateTask(e) {
    e.preventDefault();
    const form = e.target;
    const title = form.title.value.trim();
    if (!title) return alert("Nhập tiêu đề!");

    const user = this.getCurrentUser();
    if (window.Utils)
      window.Utils.toggleLoading("btn-create-task", true, "Đang lưu...");

    const idInput = form.querySelector("#selected-assignee-id");
    const finalAssigneeId = idInput && idInput.value ? idInput.value : user.id;

    const res = await taskService.createTask({
      title: title,
      quadrant:
        form.querySelector('input[name="quadrant"]:checked')?.value ||
        "do_first",
      assigneeId: finalAssigneeId,
      startTime: form.start_time.value,
      endTime: form.end_time.value,
    });

    if (window.Utils)
      window.Utils.toggleLoading("btn-create-task", false, "THÊM CÔNG VIỆC");

    if (res.status === "success") {
      if (window.Utils) window.Utils.showToast("Thành công!", "success");

      form.reset();
      this.setFormTimeDefaults(form);

      if (idInput) idInput.value = user.id;

      const sec = document.getElementById("assigneeSection");
      if (sec) sec.classList.add("hidden");

      if (typeof this.clearAssignee === "function") {
        this.clearAssignee();
      } else if (typeof this.updateAssigneeDisplay === "function") {
        this.updateAssigneeDisplay(user.id);
      }

      await this.loadTasks();
    } else {
      alert("Lỗi: " + res.message);
    }
  }

  async updateStatus(taskId, status) {
    const res = await this._callApi("update_task_status", {
      id: taskId,
      status: status,
    });
    if (res.status === "success") {
      await this.loadTasks();
      if (status == 3) {
        this.playSuccessSound();
        this.showCelebration();
      }
    }
  }

  async loadTasks() {
    const user = this.getCurrentUser();
    if (!user) return;

    const data = await taskService.fetchMyTasks(user.id);
    if (data && data.status === "success") {
      const normalized = data.data.map((t) => ({
        ...this._normalizeTask(t),
        quadrant: t.newQuadrant || t.quadrant || "do_first",
      }));

      const processed = this.processTasks(normalized);
      if (window.renderTasksGlobal) {
        window.renderTasksGlobal(processed, this.staffList);
      }
    }
  }

  // ==========================================
  // UTILS & HELPERS
  // ==========================================

  processTasks(tasks) {
    const now = new Date();
    // Tính toán offset để đồng bộ thời gian local (tránh lệch múi giờ khi so sánh string)
    const offset = now.getTimezoneOffset() * 60000;
    const todayStr = new Date(now.getTime() - offset)
      .toISOString()
      .split("T")[0];

    return tasks
      .filter((t) => {
        // 1. CẬP NHẬT TRẠNG THÁI TRỄ HẠN (OVERDUE)
        let calculatedOverdue = false;
        if (t.endTime) {
          const end = new Date(t.endTime);
          // Nếu thời gian kết thúc nhỏ hơn hiện tại thì đánh dấu trễ
          if (!isNaN(end.getTime()) && end < now) calculatedOverdue = true;
        }
        // Ghi đè hoặc cập nhật thuộc tính isOverdue để UI hiển thị nhãn
        t.isOverdue = t.isOverdue == 1 || calculatedOverdue ? 1 : 0;

        // 2. LOGIC LỌC HIỂN THỊ
        // Nếu là công việc đang thực hiện (MỚI hoặc ĐANG LÀM) -> Luôn cho hiển thị
        if (t.status == 1 || t.status == 2) return true;

        // Nếu là công việc đã kết thúc (HOÀN THÀNH hoặc HỦY)
        if (t.status == 3 || t.status == 4) {
          // Lấy chuỗi ngày YYYY-MM-DD của ngày tạo
          const createDateStr = t.createdAt
            ? new Date(new Date(t.createdAt).getTime() - offset)
                .toISOString()
                .split("T")[0]
            : "";

          // Lấy chuỗi ngày YYYY-MM-DD của ngày cập nhật cuối cùng
          const updateDateStr = t.updatedAt
            ? new Date(new Date(t.updatedAt).getTime() - offset)
                .toISOString()
                .split("T")[0]
            : "";

          /**
           * [LOGIC MỚI]:
           * Hiển thị nếu công việc đó được tạo ra trong hôm nay
           * HOẶC công việc đó được "chốt" (hoàn thành/hủy) vào đúng ngày hôm nay.
           * (Giúp xem được thành quả của cả những task cũ vừa làm xong)
           */
          return createDateStr === todayStr || updateDateStr === todayStr;
        }

        return false;
      })
      .sort((a, b) => {
        // 3. LOGIC SẮP XẾP
        const isDoneA = a.status == 3 || a.status == 4;
        const isDoneB = b.status == 3 || b.status == 4;

        // Ưu tiên đẩy các công việc đã xong xuống cuối danh sách
        if (isDoneA !== isDoneB) return isDoneA - isDoneB;

        // Sắp xếp theo hạn chót (endTime), việc nào hạn gần hơn xếp lên trước
        const tA = a.endTime ? new Date(a.endTime).getTime() : 0;
        const tB = b.endTime ? new Date(b.endTime).getTime() : 0;
        return tA - tB;
      });
  }

  async saveTitle(taskId) {
    const input = document.getElementById(`input-title-${taskId}`);
    if (!input) return;
    const res = await this._callApi("update_task_title", {
      id: taskId,
      title: input.value,
    });
    if (res.status === "success") await this.loadTasks();
  }

  _normalizeTask(t) {
    return {
      id: t.id,
      title: t.title,
      status: Number(t.status),
      createdAt: t.created_at || t.createdAt,
      updatedAt: t.updatedAt || t.updated_at, // [FIX] Lấy updatedAt từ DB
      endTime: t.end_time || t.endTime,
      startTime: t.start_time || t.startTime,
      createdById: t.created_by_id || t.createdById,
      assigneeId: t.assignee_id || t.assigneeId,
      reatedByLabel: t.created_by_name || t.createdByLabel || "System",
      assigneeLabel: t.assignee_name || t.assigneeLabel || "NV",
      isOverdue: t.isOverdue,
    };
  }

  setFormTimeDefaults(form) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    const datePart = `${year}-${month}-${day}`;

    // Giờ bắt đầu: Giờ hiện tại của máy tính
    if (form.start_time) {
      form.start_time.value = `${datePart}T${hours}:${minutes}`;
    }

    // Hạn kết thúc: MẶC ĐỊNH LUÔN LÀ 23:59 hôm nay
    if (form.end_time) {
      form.end_time.value = `${datePart}T23:59`;
    }
  }

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("current_session_user"));
    } catch (e) {
      return null;
    }
  }
  enableEditMode(id) {
    document.getElementById(`view-mode-${id}`)?.classList.add("hidden");
    document.getElementById(`edit-mode-${id}`)?.classList.remove("hidden");
    document.getElementById(`input-title-${id}`)?.focus();
  }
  cancelEdit(id) {
    document.getElementById(`view-mode-${id}`)?.classList.remove("hidden");
    document.getElementById(`edit-mode-${id}`)?.classList.add("hidden");
  }

  showCelebration() {
    const el = document.getElementById("celebration-overlay");
    const box = document.getElementById("celebration-box");

    if (el && box) {
      // 1. ÉP HIỂN THỊ TỐI CAO
      el.style.display = "flex";
      el.classList.remove("hidden", "pointer-events-none");
      // Đặt z-index cực cao để không thẻ List View nào chèn lên được
      el.style.zIndex = "999999";

      // Bắn pháo hoa (Giữ nguyên cấu hình của ông)
      if (window.confetti) {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ["#6366f1", "#10b981", "#f59e0b", "#ef4444"],
          zIndex: 1000000, // Pháo hoa nổ trên cả modal
        });
      }

      // 2. KÍCH HOẠT ANIMATION (Giữ nguyên logic của ông nhưng bọc trong requestAnimationFrame)
      window.requestAnimationFrame(() => {
        setTimeout(() => {
          el.classList.remove("opacity-0");
          box.classList.remove("scale-50");
          box.classList.add("scale-110"); // Hiệu ứng phóng to của ông

          if (window.lucide) lucide.createIcons();

          // Các icon nhảy múa
          const icons = box.querySelectorAll("i, svg, .bg-emerald-500");
          icons.forEach((icon) => icon.classList.add("animate-icon-jump"));
        }, 50);
      });

      // 3. TỰ ĐỘNG ĐÓNG (Giữ nguyên thời gian 3s của ông)
      setTimeout(() => {
        el.classList.add("opacity-0", "pointer-events-none");
        box.classList.remove("scale-110");
        box.classList.add("scale-50");

        setTimeout(() => {
          el.classList.add("hidden");
          el.style.display = "none";
          const icons = box.querySelectorAll(".animate-icon-jump");
          icons.forEach((icon) => icon.classList.remove("animate-icon-jump"));
        }, 300);
      }, 3000);
    }
  }

  playSuccessSound() {
    const audio = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3",
    );
    audio.volume = 0.5;
    audio.play().catch((e) => {});
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new TasksController().init();
});
