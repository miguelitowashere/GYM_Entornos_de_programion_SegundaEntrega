import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API = `${API_URL}/api/auth/`;

export async function loginRequest(username, password) {
  return axios.post(API + "login/", { username, password });
}

export async function getMe(token) {
  return axios.get(API + "me/", {
    headers: { Authorization: "Bearer " + token },
  });
}
