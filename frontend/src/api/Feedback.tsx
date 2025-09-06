import axios from "axios";

const API_BASE = "http://localhost:8080/api";

// ✅ โหลด Feedback ทั้งหมด
export async function getFeedbacks(token: string) {
  return axios.get(`${API_BASE}/feedbacks`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// ✅ โหลด Categories
export async function getCategories(token: string) {
  return axios.get(`${API_BASE}/categories`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// ✅ สร้าง Feedback ใหม่ (พร้อมไฟล์)
export async function createFeedback(fd: FormData, token: string) {
  return axios.post("http://localhost:8080/api/feedback", fd, {
    headers: {
      "Content-Type": "multipart/form-data", // ❗บังคับ
      Authorization: `Bearer ${token}`,
    },
  });
}