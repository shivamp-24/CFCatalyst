import apiService from "./apiService";

export const adminApi = {
  // Get admin dashboard statistics
  getStats: () => apiService.get("/admin/stats"),

  // Sync problems from Codeforces
  syncProblems: () => apiService.post("/admin/sync/problems"),

  // Sync contests from Codeforces
  syncContests: () => apiService.post("/admin/sync/contests"),

  // Get sync status
  getSyncStatus: () => apiService.get("/admin/sync/status"),

  // Sync all data
  syncAll: async () => {
    try {
      const [problemsRes, contestsRes] = await Promise.all([
        apiService.post("/admin/sync/problems"),
        apiService.post("/admin/sync/contests"),
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
