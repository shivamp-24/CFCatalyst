const User = require("../models/User");
const Problem = require("../models/Problem");
const Contest = require("../models/Contest");
const codeforcesService = require("../services/codeforcesService");
const { rateLimit } = require("../middlewares/codeforcesApiLimiter");

// Get admin dashboard statistics
const getAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalProblems, totalContests, lastSync] =
      await Promise.all([
        User.countDocuments(),
        Problem.countDocuments(),
        Contest.countDocuments(),
        Contest.findOne().sort({ updatedAt: -1 }).select("updatedAt"),
      ]);

    res.json({
      totalUsers,
      totalProblems,
      totalContests,
      lastSync: lastSync?.updatedAt || null,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ message: "Failed to fetch admin statistics" });
  }
};

// Sync problems from Codeforces
const syncProblems = async (req, res) => {
  try {
    const result = await codeforcesService.syncProblems();

    res.json({
      message: "Problems synchronized successfully",
      stats: {
        newProblemsCount: result.newProblemsCount,
        updatedProblemsCount: result.updatedProblemsCount,
        totalProblemsProcessed: result.totalProblemsProcessed,
      },
    });
  } catch (error) {
    console.error("Error syncing problems:", error);
    res.status(500).json({ message: "Failed to sync problems" });
  }
};

// Sync contests from Codeforces
const syncContests = async (req, res) => {
  try {
    const result = await codeforcesService.syncContests();

    res.json({
      message: "Contests synchronized successfully",
      stats: {
        newContestsCount: result.newContestsCount,
        updatedContestsCount: result.updatedContestsCount,
        totalContestsProcessed: result.totalContestsProcessed,
      },
    });
  } catch (error) {
    console.error("Error syncing contests:", error);
    res.status(500).json({ message: "Failed to sync contests" });
  }
};

// Get sync status
const getSyncStatus = async (req, res) => {
  try {
    const lastUpdates = await Promise.all([
      Problem.findOne().sort({ updatedAt: -1 }).select("updatedAt"),
      Contest.findOne().sort({ updatedAt: -1 }).select("updatedAt"),
    ]);

    res.json({
      lastProblemSync: lastUpdates[0]?.updatedAt || null,
      lastContestSync: lastUpdates[1]?.updatedAt || null,
    });
  } catch (error) {
    console.error("Error fetching sync status:", error);
    res.status(500).json({ message: "Failed to fetch sync status" });
  }
};

module.exports = {
  getAdminStats,
  syncProblems,
  syncContests,
  getSyncStatus,
};
