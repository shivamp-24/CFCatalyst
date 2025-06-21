// This file sets up a central axios instance. It's the bridge to backend.

import axios from "axios";

const apiService = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

// Interceptor to add the JWT token to every request if it exists
apiService.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiService;
