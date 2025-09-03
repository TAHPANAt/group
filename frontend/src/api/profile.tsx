import axios from "axios";

const BASE = "http://localhost:8080/api";

// POST /api/profile
export const createOrUpdateProfile = (formData: FormData) => {
  return axios.post(`${BASE}/profile`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// GET /api/profile/:memberId
export const getProfileByMemberId = (memberId: string | number) => {
  return axios.get(`${BASE}/profile/${memberId}`);
};
