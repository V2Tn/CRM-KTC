import taskService from "../service/task/task-min.js";
class TasksController {
  constructor() {
    ((this.staffList = []), (window.TaskController = this));
  }
  async _callApi(e, t = {}) {
    try {
      const s = await fetch("api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: e, ...t }),
      });
      return await s.json();
    } catch (e) {
      return { status: "error", message: "Lỗi kết nối" };
    }
  }
  async init() {
    const e = document.getElementById("createTaskForm");
    if (e) {
      const t = e.cloneNode(!0);
      (e.parentNode.replaceChild(t, e),
        t.addEventListener("submit", (e) => this.handleCreateTask(e)),
        this.setFormTimeDefaults(t),
        this.setupAssigneeToggle(t));
    }
    (this.getCurrentUser() && (await this.loadTasks()), this.initDragAndDrop());
  }
  setupAssigneeToggle(e) {
    const t = e.querySelector("#assign-toggle-btn"),
      s = e.querySelector("#assigneeSection"),
      i = e.querySelector("#assignee-list-container"),
      a = e.querySelector("#search-assignee"),
      n = e.querySelector("#selected-assignee-id"),
      r = this.getCurrentUser();
    (n && (n.value = r.id),
      t &&
        (this.updateAssigneeDisplay(r.id),
        (t.onclick = async () => {
          const e = s.classList.contains("hidden"),
            t = document.getElementById("assign-toggle-icon");
          if (e)
            if (
              (s.classList.remove("hidden"),
              t && (t.style.transform = "rotate(180deg)"),
              0 === this.staffList.length)
            ) {
              const e = await this._callApi("fetch_assignable_users");
              "success" === e.status &&
                ((this.staffList = e.data),
                this.renderAssigneeList(this.staffList, i, n));
            } else this.renderAssigneeList(this.staffList, i, n);
          else
            (s.classList.add("hidden"),
              t && (t.style.transform = "rotate(0deg)"));
        }),
        a &&
          (a.oninput = () => {
            const e = a.value.toLowerCase(),
              t = this.staffList.filter((t) =>
                t.fullName.toLowerCase().includes(e),
              );
            this.renderAssigneeList(t, i, n);
          }),
        document.addEventListener("click", (e) => {
          if (
            s &&
            !s.classList.contains("hidden") &&
            !e.target.closest("#assign-toggle-wrapper")
          ) {
            s.classList.add("hidden");
            const e = document.getElementById("assign-toggle-icon");
            e && (e.style.transform = "rotate(0deg)");
          }
        })));
  }
  renderAssigneeList(e, t, s) {
    if (!t || !s) return;
    const i = s.value;
    0 !== e.length
      ? ((t.innerHTML = e
          .map((e) => {
            const t = e.id == i,
              s = Utils.formatShortName(e.fullName),
              a = Utils.getAvatar(e.avatar, e.fullName, 128),
              n = e.dept_name || "Nhân sự";
            return `\n            <div onclick="TaskController.selectAssignee(${e.id})" \n                 class="flex items-center justify-between p-2.5 rounded-2xl border-2 transition-all cursor-pointer group mb-1\n                        ${t ? "border-indigo-500 bg-indigo-50 shadow-sm" : "border-transparent bg-white hover:bg-slate-50 hover:border-indigo-100"}">\n                <div class="flex items-center gap-3 min-w-0">\n                    <img src="${a}" class="w-9 h-9 rounded-full object-cover shadow-sm bg-white shrink-0 border border-slate-100">\n                    <div class="truncate">\n                        <p class="text-[13px] font-[900] truncate leading-tight ${t ? "text-indigo-700" : "text-slate-700"}">${s}</p>\n                        <span class="text-[9px] font-bold text-slate-400 uppercase bg-white px-1.5 py-0.5 rounded-md border border-slate-100 inline-block mt-1">${n}</span>\n                    </div>\n                </div>\n                <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all border\n                            ${t ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-slate-50 text-slate-300 border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-400 group-hover:border-indigo-100"}">\n                    <i data-lucide="${t ? "check" : "plus"}" width="12" class="${t ? "stroke-[3]" : ""}"></i>\n                </div>\n            </div>`;
          })
          .join("")),
        window.lucide && lucide.createIcons())
      : (t.innerHTML =
          '<div class="text-center py-6 text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Không tìm thấy nhân viên</div>');
  }
  selectAssignee(e) {
    const t = document.getElementById("selected-assignee-id"),
      s = document.getElementById("assigneeSection"),
      i = document.getElementById("assign-toggle-icon");
    t &&
      ((t.value = e),
      this.updateAssigneeDisplay(e),
      s && s.classList.add("hidden"),
      i && (i.style.transform = "rotate(0deg)"));
  }
  updateAssigneeDisplay(e) {
    const t = document.getElementById("assign-toggle-btn");
    if (!t) return;
    const s = this.getCurrentUser();
    if (e == s.id)
      ((t.className =
        "flex items-center justify-between p-3.5 rounded-2xl border-2 border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 cursor-pointer transition-all group"),
        (t.innerHTML =
          '\n                <div class="flex items-center gap-3">\n                    <div class="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-white group-hover:border-indigo-400 transition-colors">\n                        <i data-lucide="user-plus" class="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors"></i>\n                    </div>\n                    <span class="text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Giao việc cho người khác</span>\n                </div>\n                <i data-lucide="chevron-down" class="text-slate-400 transition-transform" id="assign-toggle-icon" width="16"></i>\n            '));
    else {
      const s = this.staffList.find((t) => t.id == e);
      if (s) {
        const e = Utils.formatShortName(s.fullName),
          i = Utils.getAvatar(s.avatar, s.fullName, 128),
          a = s.dept_name || "Nhân sự";
        ((t.className =
          "flex items-center justify-between p-2.5 rounded-2xl border-2 border-indigo-500 bg-indigo-50/50 cursor-pointer transition-all shadow-sm"),
          (t.innerHTML = `\n                    <div class="flex items-center gap-3">\n                        <img src="${i}" class="w-10 h-10 rounded-full object-cover shadow-sm bg-white border border-indigo-100">\n                        <div class="flex flex-col text-left">\n                            <span class="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Giao việc cho</span>\n                            <span class="text-sm font-[900] text-indigo-700 leading-none">${e} <span class="text-[9px] text-slate-500 ml-1 bg-white px-1.5 py-0.5 rounded border border-slate-200">${a}</span></span>\n                        </div>\n                    </div>\n                    <div class="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all cursor-pointer shadow-sm" onclick="event.stopPropagation(); TaskController.clearAssignee()">\n                        <i data-lucide="x" width="14"></i>\n                    </div>\n                    <i data-lucide="chevron-down" class="hidden" id="assign-toggle-icon"></i>\n                `));
      }
    }
    window.lucide && lucide.createIcons();
  }
  clearAssignee() {
    const e = this.getCurrentUser(),
      t = document.getElementById("selected-assignee-id");
    (t && (t.value = e.id), this.updateAssigneeDisplay(e.id));
    const s = document.getElementById("assignee-list-container");
    s &&
      this.staffList.length > 0 &&
      this.renderAssigneeList(this.staffList, s, t);
  }
  initDragAndDrop() {
    ["do_first", "schedule", "delegate", "eliminate"].forEach((e) => {
      const t = document.getElementById(`list-${e}`);
      t &&
        ((t.ondragover = (e) => e.preventDefault()),
        (t.ondragenter = () => t.classList.add("bg-slate-100/50")),
        (t.ondragleave = () => t.classList.remove("bg-slate-100/50")),
        (t.ondrop = (t) => this.handleDrop(t, e)));
    });
  }
  handleDragStart(e, t) {
    e.dataTransfer.setData("text/plain", t);
    const s = document.getElementById(`task-card-${t}`);
    s && setTimeout(() => s.classList.add("opacity-40"), 0);
  }
  async handleDrop(e, t) {
    e.preventDefault();
    const s = document.getElementById(`list-${t}`);
    s && s.classList.remove("bg-slate-100/50");
    const i = e.dataTransfer.getData("text/plain"),
      a = document.getElementById(`task-card-${i}`);
    if (a) {
      a.classList.remove("opacity-40");
      const e = await this._callApi("update_task_quadrant", {
        id: i,
        newQuadrant: t,
      });
      "success" === e.status
        ? (window.Utils &&
            window.Utils.showToast("Đã di chuyển công việc!", "success"),
          await this.loadTasks())
        : (window.Utils &&
            window.Utils.showToast("Lỗi di chuyển: " + e.message, "error"),
          await this.loadTasks());
    }
  }
  async handleCreateTask(e) {
    e.preventDefault();
    const t = e.target,
      s = t.title.value.trim();
    if (!s) return alert("Nhập tiêu đề!");
    const i = this.getCurrentUser();
    window.Utils &&
      window.Utils.toggleLoading("btn-create-task", !0, "Đang lưu...");
    const a = t.querySelector("#selected-assignee-id"),
      n = a && a.value ? a.value : i.id,
      r = await taskService.createTask({
        title: s,
        quadrant:
          t.querySelector('input[name="quadrant"]:checked')?.value ||
          "do_first",
        assigneeId: n,
        startTime: t.start_time.value,
        endTime: t.end_time.value,
      });
    if (
      (window.Utils &&
        window.Utils.toggleLoading("btn-create-task", !1, "THÊM CÔNG VIỆC"),
      "success" === r.status)
    ) {
      (window.Utils && window.Utils.showToast("Thành công!", "success"),
        t.reset(),
        this.setFormTimeDefaults(t),
        a && (a.value = i.id));
      const e = document.getElementById("assigneeSection");
      (e && e.classList.add("hidden"),
        "function" == typeof this.clearAssignee
          ? this.clearAssignee()
          : "function" == typeof this.updateAssigneeDisplay &&
            this.updateAssigneeDisplay(i.id),
        await this.loadTasks());
    } else alert("Lỗi: " + r.message);
  }
  async updateStatus(e, t) {
    "success" ===
      (await this._callApi("update_task_status", { id: e, status: t }))
        .status &&
      (await this.loadTasks(),
      3 == t && (this.playSuccessSound(), this.showCelebration()));
  }
  async loadTasks() {
    const e = this.getCurrentUser();
    if (!e) return;
    const t = await taskService.fetchMyTasks(e.id);
    if (t && "success" === t.status) {
      const e = t.data.map((e) => ({
          ...this._normalizeTask(e),
          quadrant: e.newQuadrant || e.quadrant || "do_first",
        })),
        s = this.processTasks(e);
      window.renderTasksGlobal && window.renderTasksGlobal(s, this.staffList);
    }
  }
  processTasks(e) {
    const t = new Date(),
      s = 6e4 * t.getTimezoneOffset(),
      i = new Date(t.getTime() - s).toISOString().split("T")[0];
    return e
      .filter((e) => {
        let a = !1;
        if (e.endTime) {
          const s = new Date(e.endTime);
          !isNaN(s.getTime()) && s < t && (a = !0);
        }
        if (
          ((e.isOverdue = 1 == e.isOverdue || a ? 1 : 0),
          1 == e.status || 2 == e.status)
        )
          return !0;
        if (3 == e.status || 4 == e.status) {
          const t = e.createdAt
              ? new Date(new Date(e.createdAt).getTime() - s)
                  .toISOString()
                  .split("T")[0]
              : "",
            a = e.updatedAt
              ? new Date(new Date(e.updatedAt).getTime() - s)
                  .toISOString()
                  .split("T")[0]
              : "";
          return t === i || a === i;
        }
        return !1;
      })
      .sort((e, t) => {
        const s = 3 == e.status || 4 == e.status,
          i = 3 == t.status || 4 == t.status;
        if (s !== i) return s - i;
        return (
          (e.endTime ? new Date(e.endTime).getTime() : 0) -
          (t.endTime ? new Date(t.endTime).getTime() : 0)
        );
      });
  }
  async saveTitle(e) {
    const t = document.getElementById(`input-title-${e}`);
    if (!t) return;
    "success" ===
      (await this._callApi("update_task_title", { id: e, title: t.value }))
        .status && (await this.loadTasks());
  }
  _normalizeTask(e) {
    return {
      id: e.id,
      title: e.title,
      status: Number(e.status),
      createdAt: e.created_at || e.createdAt,
      updatedAt: e.updatedAt || e.updated_at,
      endTime: e.end_time || e.endTime,
      startTime: e.start_time || e.startTime,
      createdById: e.created_by_id || e.createdById,
      assigneeId: e.assignee_id || e.assigneeId,
      createdByLabel: e.created_by_name || "System",
      assigneeLabel: e.assignee_name || "NV",
      isOverdue: e.isOverdue,
    };
  }
  setFormTimeDefaults(e) {
    const t = new Date(),
      s = t.getFullYear(),
      i = String(t.getMonth() + 1).padStart(2, "0"),
      a = String(t.getDate()).padStart(2, "0"),
      n = String(t.getHours()).padStart(2, "0"),
      r = String(t.getMinutes()).padStart(2, "0"),
      d = `${s}-${i}-${a}`;
    (e.start_time && (e.start_time.value = `${d}T${n}:${r}`),
      e.end_time && (e.end_time.value = `${d}T23:59`));
  }
  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("current_session_user"));
    } catch (e) {
      return null;
    }
  }
  enableEditMode(e) {
    (document.getElementById(`view-mode-${e}`)?.classList.add("hidden"),
      document.getElementById(`edit-mode-${e}`)?.classList.remove("hidden"),
      document.getElementById(`input-title-${e}`)?.focus());
  }
  cancelEdit(e) {
    (document.getElementById(`view-mode-${e}`)?.classList.remove("hidden"),
      document.getElementById(`edit-mode-${e}`)?.classList.add("hidden"));
  }
  showCelebration() {
    const e = document.getElementById("celebration-overlay"),
      t = document.getElementById("celebration-box");
    e &&
      t &&
      ((e.style.display = "flex"),
      e.classList.remove("hidden", "pointer-events-none"),
      (e.style.zIndex = "999999"),
      window.confetti &&
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ["#6366f1", "#10b981", "#f59e0b", "#ef4444"],
          zIndex: 1e6,
        }),
      window.requestAnimationFrame(() => {
        setTimeout(() => {
          (e.classList.remove("opacity-0"),
            t.classList.remove("scale-50"),
            t.classList.add("scale-110"),
            window.lucide && lucide.createIcons());
          t.querySelectorAll("i, svg, .bg-emerald-500").forEach((e) =>
            e.classList.add("animate-icon-jump"),
          );
        }, 50);
      }),
      setTimeout(() => {
        (e.classList.add("opacity-0", "pointer-events-none"),
          t.classList.remove("scale-110"),
          t.classList.add("scale-50"),
          setTimeout(() => {
            (e.classList.add("hidden"), (e.style.display = "none"));
            t.querySelectorAll(".animate-icon-jump").forEach((e) =>
              e.classList.remove("animate-icon-jump"),
            );
          }, 300));
      }, 3e3));
  }
  playSuccessSound() {
    const e = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3",
    );
    ((e.volume = 0.5), e.play().catch((e) => {}));
  }
}
document.addEventListener("DOMContentLoaded", () => {
  new TasksController().init();
});
