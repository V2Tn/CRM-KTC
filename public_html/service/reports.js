/**
 * service/reports.js
 * Service Báo cáo
 */

class ReportService {
  /**
   * Helper gọi API an toàn (Utils là global từ file utils.js)
   * @param {string} action Tên action gọi API
   * @param {object} params Tham số gửi đi
   * @returns {Promise<any>}
   */
  async _api(action, params = {}) {
    if (!window.Utils || typeof window.Utils.callApi !== "function") {
      console.error("Lỗi: Utils chưa được tải");
      return { status: "error", message: "Lỗi hệ thống" };
    }
    return await window.Utils.callApi(action, params);
  }

  /**
   * Lấy dữ liệu báo cáo theo khoảng thời gian
   * @param {string} period 'today', 'week', 'month', 'year'
   * @param {string|null} filter 'all' hoặc null
   * @returns {Promise<any>}
   */
  async fetchReportData(period, filter = null) {
    const payload = { period, ...(filter && { filter }) };
    return await this._api("fetch_report_data", payload);
  }
}

// Export một instance của service để các controller có thể dùng chung
export default new ReportService();
