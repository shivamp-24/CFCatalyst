import apiService from "./apiService";

export const adminApi = {
  // Get admin dashboard statistics
  getStats: () => apiService.get("/api/admin/stats"),

  // Sync problems from Codeforces
  syncProblems: () => apiService.post("/api/admin/sync/problems"),

  // Sync contests from Codeforces
  syncContests: () => apiService.post("/api/admin/sync/contests"),

  // Get sync status
  getSyncStatus: () => apiService.get("/api/admin/sync/status"),

  // Sync all data
  syncAll: async () => {
    try {
      const [problemsRes, contestsRes] = await Promise.all([
        apiService.post("/api/admin/sync/problems"),
        apiService.post("/api/admin/sync/contests"),
      ]);

      return {
        problems: problemsRes.data,
        contests: contestsRes.data,
      };
    } catch (error) {
      throw error;
    }
  },
};

// Separate service for impressions that can be used by any component
export const impressionApi = {
  recordImpression: (page) => apiService.post("/api/impressions", { page }),
};
