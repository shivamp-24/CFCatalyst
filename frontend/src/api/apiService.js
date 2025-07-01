// This file sets up a central axios instance. It's the bridge to backend.

import axios from "axios";

const apiService = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  timeout: 30000, // 30 seconds timeout
  timeoutErrorMessage: "Server request timed out. Please try again later.",
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

// Response interceptor for handling common errors
apiService.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle timeouts and server errors in a user-friendly way
    if (error.code === "ECONNABORTED") {
      console.error("Request timeout:", error.message);
      return Promise.reject({
        response: {
          data: {
            message:
              "Server is taking too long to respond. Please try again later.",
          },
        },
      });
    }

    if (!error.response) {
      console.error("Network error:", error.message);
      return Promise.reject({
        response: {
          data: {
            message:
              "Cannot connect to server. Please check your internet connection and try again.",
          },
        },
      });
    }

    return Promise.reject(error);
  }
);

// User related API functions
export const userApi = {
  // Get user's profile by Codeforces handle
  getProfile: async (codeforcesHandle) => {
    const response = await apiService.get(
      `/api/users/profile/${codeforcesHandle}`
    );
    return response.data;
  },

  // Update user's profile
  updateProfile: async (profileData) => {
    const response = await apiService.put("/api/users/profile", profileData);
    return response.data;
  },

  // Get user's Codeforces stats
  getCFStats: async () => {
    const response = await apiService.get("/api/users/me/cf-stats");
    return response.data;
  },

  // Get user's practice history
  getPracticeHistory: async () => {
    const response = await apiService.get("/api/users/me/practice-history");
    return response.data;
  },

  // Update user's Codeforces data (including avatar)
  updateCFData: async () => {
    const response = await apiService.put("/api/auth/update-cf-data");
    return response.data;
  },

  // Get user's dashboard statistics
  getDashboardStats: async () => {
    const response = await apiService.get("/api/users/me/dashboard-stats");
    return response.data;
  },

  // Force update of dashboard statistics
  updateDashboardStats: async () => {
    const response = await apiService.post(
      "/api/users/me/dashboard-stats/update"
    );
    return response.data;
  },

  // Get user's recent contests (both Codeforces and practice contests)
  getRecentContests: async (limit = 5, refresh = false) => {
    const response = await apiService.get(
      `/api/users/me/recent-contests?limit=${limit}&refresh=${refresh}`
    );
    return response.data;
  },

  // Get all user's contests with filtering options
  getAllContests: async (options = {}) => {
    const {
      timeFilter = "all-time",
      sortBy = "date-desc",
      contestType = "all",
      refresh = false,
      page = 1,
    } = options;

    const queryParams = new URLSearchParams({
      timeFilter,
      sortBy,
      contestType,
      refresh: refresh.toString(),
      page: page.toString(),
    });

    const response = await apiService.get(
      `/api/users/me/all-contests?${queryParams}`
    );
    return response.data;
  },

  // Get user's weak topics based on submission history
  getWeakTopics: async (refresh = false) => {
    const response = await apiService.get(
      `/api/users/me/weak-topics${refresh ? "?refresh=true" : ""}`
    );
    return response.data;
  },
};

// Practice Contest related API functions
export const practiceContestApi = {
  // Generate a new practice contest
  generateContest: async (contestParams) => {
    try {
      const response = await apiService.post(
        "/api/practice-contests/generate",
        contestParams
      );
      return response.data;
    } catch (error) {
      console.error("API error generating contest:", error);
      // Rethrow to allow component to handle the error
      throw error;
    }
  },

  // Get user's practice contests
  getUserContests: async (page = 1, limit = 10, status = null) => {
    let url = `/api/practice-contests/me?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    const response = await apiService.get(url);
    return response.data;
  },

  // Get specific practice contest
  getContest: async (contestId) => {
    const response = await apiService.get(
      `/api/practice-contests/${contestId}`
    );
    return response.data;
  },

  // Start a practice contest
  startContest: async (contestId) => {
    const response = await apiService.post(
      `/api/practice-contests/${contestId}/start`
    );
    return response.data;
  },

  // Complete a practice contest
  completeContest: async (contestId, problemSolutions = null) => {
    const response = await apiService.post(
      `/api/practice-contests/${contestId}/complete`,
      { problemSolutions }
    );
    return response.data;
  },

  // Access editorial for a problem in a contest
  accessEditorial: async (contestId, problemId) => {
    const response = await apiService.put(
      `/api/practice-contests/${contestId}/problems/${problemId}/editorial`
    );
    return response.data;
  },

  // Sync contest submissions from Codeforces
  syncSubmissions: async (contestId) => {
    const response = await apiService.post(
      `/api/practice-contests/${contestId}/sync`
    );
    return response.data;
  },
};

export default apiService;
