// service/task/task.js

class TaskService {
  constructor() {
    // Đường dẫn gọi từ trình duyệt (index.php) vào api.php là cùng cấp
    this.apiUrl = "api.php";
  }

  // Hàm gọi API chung
  async _request(payload) {
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      return { status: "error", message: "Lỗi kết nối server" };
    }
  }

  // 1. Lấy danh sách task của tôi
  async fetchMyTasks(userId) {
    return await this._request({
      action: "fetch_my_tasks",
      userId: userId,
    });
  }

  // 2. Tạo task mới
  async createTask(taskData) {
    /**
     * [ĐỒNG BỘ] Nhận trực tiếp các trường từ TasksController truyền xuống.
     * Đảm bảo 'assigneeId' được map chính xác sang 'assigneeId' để API nhận diện đúng.
     */
    return await this._request({
      action: "create_task",
      title: taskData.title,
      quadrant: taskData.quadrant, // do_first, schedule...
      startTime: taskData.startTime, // Khớp với tham số TasksController truyền
      endTime: taskData.endTime, // Khớp với tham số TasksController truyền
      assigneeId: taskData.assigneeId, // [FIX] Dùng assigneeId để đồng bộ hoàn toàn
    });
  }

  // 3. Update trạng thái (Checkbox)
  async updateStatus(taskId, newStatus) {
    return await this._request({
      action: "update_task_status",
      id: taskId,
      status: newStatus,
    });
  }
}

// Export một instance để dùng luôn
export default new TaskService();
