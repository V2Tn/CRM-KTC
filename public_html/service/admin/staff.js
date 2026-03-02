/**
 * service/admin/staff.js
 * Service Nhân sự (ES Module)
 */

class StaffService {
  // Helper gọi API an toàn (Utils là global từ file utils.js)
  async _api(action, params = {}) {
    if (!window.Utils || typeof window.Utils.callApi !== "function") {
      console.error("Lỗi: Utils chưa được tải");
      return { status: "error", message: "Lỗi hệ thống" };
    }
    return await window.Utils.callApi(action, params);
  }

  // --- CRUD ---
  async getAll() {
    return await this._api("fetch_all_staff");
  }
  async create(data) {
    return await this._api("create_staff", data);
  }
  async update(data) {
    return await this._api("update_staff", data);
  }
  async delete(id) {
    return await this._api("delete_staff", { id });
  }
  async getRoles() {
    return await this._api("fetch_roles");
  }

  // --- HELPER ---
  async getManagers() {
    return await this._api("fetch_managers_for_select");
  }
  async getAvailableUsers() {
    return await this._api("fetch_available_users");
  }
  async getMembersByDept(deptId) {
    return await this._api("fetch_dept_members", { id: deptId });
  }
}

// Export instance
export default new StaffService();
