import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function getMachines(token) {
  const response = await axios.get(`${API_URL}/api/machines/`, {
    headers: {
      Authorization: "Bearer " + token
    }
  });

  return response.data;
}
