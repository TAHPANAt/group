import axios from "axios";

const BASE = "http://localhost:8080/api";

// POST /api/profile
export const createOrUpdateProfile = (formData: FormData, token: string) => {
  return axios.post(`${BASE}/profile`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,   // ✅ ส่ง token ไปด้วย
    },
  });
};

// GET /api/getprofile
export const getMyProfile = (token: string) => {
  return axios.get(`${BASE}/getprofile`, {
    headers: {
      Authorization: `Bearer ${token}`,   // ✅ ส่ง token ไปด้วย
    },
  });
};

// PUT /api/people/update
export const updatePeople = (data: any, token: string) => {
  return axios.put(`${BASE}/people/update`, data, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,   // ✅ ส่ง token ไปด้วย
    },
  });
};
export const deleteAccount = async (token: string) => {
  return axios.delete(`${BASE}/account/delete`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};