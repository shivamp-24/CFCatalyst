const User = require("../models/User");
const Problem = require("../models/Problem");
const Contest = require("../models/Contest");
const Impression = require("../models/Impression");
const Submission = require("../models/Submission");
const PracticeContest = require("../models/PracticeContest");
const codeforcesService = require("../services/codeforcesService");
const { rateLimit } = require("../middlewares/codeforcesApiLimiter");

// Get admin dashboard statistics
const getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalProblems,
      totalContests,
      lastSync,
      totalSubmissions,
      totalPracticeContests,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      activeUsersToday,
      activeUsersThisWeek,
      activeUsersThisMonth,
      usersByRating,
      totalImpressions,
      impressionsToday,
      impressionsThisWeek,
      impressionsThisMonth,
      impressionsByPage,
    ] = await Promise.all([
      User.countDocuments(),
      Problem.countDocuments(),
      Contest.countDocuments(),
      Contest.findOne().sort({ updatedAt: -1 }).select("updatedAt"),
      Submission.countDocuments(),
      PracticeContest.countDocuments(),

      // New users today
      User.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),

      // New users this week
      User.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
      }),

      // New users this month
      User.countDocuments({
        createdAt: { $gte: new Date(new Date().setDate(1)) },
      }),

      // Active users today
      User.countDocuments({
        updatedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),

      // Active users this week
      User.countDocuments({
        updatedAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
      }),

      // Active users this month
      User.countDocuments({
        updatedAt: { $gte: new Date(new Date().setDate(1)) },
      }),

      // Users by rating range
      User.aggregate([
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  {
                    case: { $lt: ["$codeforcesRating", 1200] },
                    then: "Newbie",
                  },
                  { case: { $lt: ["$codeforcesRating", 1400] }, then: "Pupil" },
                  {
                    case: { $lt: ["$codeforcesRating", 1600] },
                    then: "Specialist",
                  },
                  {
                    case: { $lt: ["$codeforcesRating", 1900] },
                    then: "Expert",
                  },
                  {
                    case: { $lt: ["$codeforcesRating", 2100] },
                    then: "Candidate Master",
                  },
                  {
                    case: { $lt: ["$codeforcesRating", 2300] },
                    then: "Master",
                  },
                  {
                    case: { $lt: ["$codeforcesRating", 2400] },
                    then: "International Master",
                  },
                  {
                    case: { $lt: ["$codeforcesRating", 2600] },
                    then: "Grandmaster",
                  },
                  {
                    case: { $lt: ["$codeforcesRating", 3000] },
                    then: "International Grandmaster",
                  },
                  {
                    case: { $gte: ["$codeforcesRating", 3000] },
                    then: "Legendary Grandmaster",
                  },
                ],
                default: "Unrated",
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),

      // Total impressions
      Impression.countDocuments(),

      // Impressions today
      Impression.countDocuments({
        timestamp: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),

      // Impressions this week
      Impression.countDocuments({
        timestamp: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
      }),

      // Impressions this month
      Impression.countDocuments({
        timestamp: { $gte: new Date(new Date().setDate(1)) },
      }),

      // Impressions by page
      Impression.aggregate([
        {
          $group: {
            _id: "$page",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 10,
        },
      ]),
    ]);

    res.json({
      totalUsers,
      totalProblems,
      totalContests,
      lastSync: lastSync?.updatedAt || null,
      totalSubmissions,
      totalPracticeContests,
      userStats: {
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
        activeUsersToday,
        activeUsersThisWeek,
        activeUsersThisMonth,
        usersByRating: usersByRating.map((item) => ({
          rating: item._id,
          count: item.count,
        })),
      },
      impressionStats: {
        total: totalImpressions,
        today: impressionsToday,
        thisWeek: impressionsThisWeek,
        thisMonth: impressionsThisMonth,
        byPage: impressionsByPage.map((item) => ({
          page: item._id,
          count: item.count,
        })),
      },
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

// Record a page impression
const recordImpression = async (req, res) => {
  try {
    const { page } = req.body;

    if (!page) {
      return res.status(400).json({ message: "Page parameter is required" });
    }

    const impression = new Impression({
      page,
      userId: req.user ? req.user._id : null,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      referrer: req.headers.referer || req.headers.referrer,
    });

    await impression.save();

    res.status(201).json({ message: "Impression recorded successfully" });
  } catch (error) {
    console.error("Error recording impression:", error);
    res.status(500).json({ message: "Failed to record impression" });
  }
};

module.exports = {
  getAdminStats,
  syncProblems,
  syncContests,
  getSyncStatus,
  recordImpression,
};
