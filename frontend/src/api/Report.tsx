import axios from "axios";

const API_BASE = "http://localhost:8080";

// ==================== Create Report ====================
export async function createReport(fd: FormData, token: string) {
  return axios.post(`${API_BASE}/api/reports`, fd, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
}

// ==================== Get Reports ====================
export async function getReports(token: string) {
  return axios.get(`${API_BASE}/api/reports`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ==================== Get Report Types ====================
export async function getReportTypes(token: string) {
  return axios.get(`${API_BASE}/api/report-types`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}