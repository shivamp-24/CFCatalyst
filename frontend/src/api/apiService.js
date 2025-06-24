// This file sets up a central axios instance. It's the bridge to backend.

import axios from "axios";

const apiService = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api",
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

// User related API functions
export const userApi = {
  // Get user's profile by Codeforces handle
  getProfile: async (codeforcesHandle) => {
    const response = await apiService.get(`/users/profile/${codeforcesHandle}`);
    return response.data;
  },

  // Update user's profile
  updateProfile: async (profileData) => {
    const response = await apiService.put("/users/profile", profileData);
    return response.data;
  },

  // Get user's Codeforces stats
  getCFStats: async () => {
    const response = await apiService.get("/users/me/cf-stats");
    return response.data;
  },

  // Get user's practice history
  getPracticeHistory: async () => {
    const response = await apiService.get("/users/me/practice-history");
    return response.data;
  },

  // Update user's Codeforces data (including avatar)
  updateCFData: async () => {
    const response = await apiService.put("/auth/update-cf-data");
    return response.data;
  },

  // Get user's dashboard statistics
  getDashboardStats: async () => {
    const response = await apiService.get("/users/me/dashboard-stats");
    return response.data;
  },

  // Force update of dashboard statistics
  updateDashboardStats: async () => {
    const response = await apiService.post("/users/me/dashboard-stats/update");
    return response.data;
  },

  // Get user's recent contests (both Codeforces and practice contests)
  getRecentContests: async (limit = 5, refresh = false) => {
    const response = await apiService.get(
      `/users/me/recent-contests?limit=${limit}&refresh=${refresh}`
    );
    return response.data;
  },
};

export default apiService;
