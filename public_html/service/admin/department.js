/**
 * service/admin/department.js
 * Service Phòng ban (ES Module)
 */

class DepartmentService {
  async _api(action, params = {}) {
    if (!window.Utils) return { status: "error", message: "Lỗi hệ thống" };
    return await window.Utils.callApi(action, params);
  }

  async getAll() {
    return await this._api("fetch_deparments");
  }
  async create(data) {
    return await this._api("create_department", data);
  }
  async update(data) {
    return await this._api("update_department", data);
  }
  async delete(id) {
    return await this._api("delete_department", { id });
  }
}

export default new DepartmentService();
