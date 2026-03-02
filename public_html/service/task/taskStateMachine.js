/**
 * service/task/taskStateMachine.js
 * FIXED: Mapping đúng ID Database (1, 2, 3, 4)
 */

export const TASK_STATUS = {
  PENDING: 1, // Mới
  DOING: 2, // Đang làm
  COMPLETED: 3, // Hoàn thành
  CANCELLED: 4, // Hủy
};

// Cấu hình hiển thị
const STATE_CONFIG = {
  [TASK_STATUS.PENDING]: {
    label: "MỚI",
    color: "bg-blue-500 text-white",
    actions: ["START", "DONE", "CANCEL"],
  },
  [TASK_STATUS.DOING]: {
    label: "ĐANG LÀM",
    color: "bg-indigo-500 text-white animate-pulse",
    actions: ["DONE", "CANCEL"],
  },
  [TASK_STATUS.COMPLETED]: {
    label: "HOÀN THÀNH",
    color: "bg-emerald-500 text-white",
    actions: ["REDO"],
  },
  [TASK_STATUS.CANCELLED]: {
    label: "ĐÃ HỦY",
    color: "bg-slate-400 text-white line-through",
    actions: ["REDO"],
  },
};

const ACTION_CONFIG = {
  START: { target: 2, icon: "play", class: "bg-indigo-50 text-indigo-600" },
  DONE: { target: 3, icon: "check", class: "bg-emerald-50 text-emerald-600" },
  CANCEL: { target: 4, icon: "x", class: "bg-rose-50 text-rose-500" },
  REDO: { target: 1, icon: "rotate-ccw", class: "bg-amber-50 text-amber-600" },
};

export const TaskStateMachine = {
  getStateInfo(status) {
    return STATE_CONFIG[status] || STATE_CONFIG[1];
  },
  getAvailableActions(status) {
    const config = this.getStateInfo(status);
    if (!config || !config.actions) return [];
    return config.actions.map((key) => ({ key, ...ACTION_CONFIG[key] }));
  },
};
