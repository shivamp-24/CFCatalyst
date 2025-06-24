const PracticeContest = require("../models/PracticeContest");
const User = require("../models/User");
const Contest = require("../models/Contest");
const codeforcesService = require("../services/codeforcesService");
const dashboardStatsService = require("../services/dashboardStatsService");

// @desc    Get user profile by Codeforces handle
// @route   GET /api/users/profile/:codeforcesHandle
const getProfile = async (req, res) => {
  const { codeforcesHandle } = req.params;

  try {
    //first try to find user in database
    let user = await User.findOne({ codeforcesHandle }).select("-password");

    if (user) {
      //merge info with cfData
      const cfData = await codeforcesService.getUserInfo(codeforcesHandle);
      const profileData = { ...user.toObject(), ...cfData };
      return res.json(profileData);
    } else {
      // user not found in DB -> fetch from CF API
      const cfData = await codeforcesService.getUserInfo(codeforcesHandle);
      if (cfData) {
        return res.json({
          codeforcesHandle: cfData.handle, // CF API uses 'handle'
          codeforcesRating: cfData.rating,
          maxRating: cfData.maxRating,
          rank: cfData.rank,
          maxRank: cfData.maxRank,
          avatar: cfData.avatar,
        });
      } else {
        return res
          .status(404)
          .json({ message: `User profile for ${codeforcesHandle} not found.` });
      }
    }
  } catch (error) {
    console.error(
      `Error fetching profile for ${codeforcesHandle}:`,
      error.message
    );
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

// @desc    Update authenticated user's profile
// @route   PUT /api/users/profile
const updateProfile = async (req, res) => {
  const { email, name, bio, country, role } = req.body;
  const userId = req.user.id; // From authMiddleware

  try {
    //find the user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    //update allowed fields
    if (email) {
      //check if email is not taken by any other user
      const emailExists = await User.findOne({
        email: email,
        _id: { $ne: userId },
      });
      if (emailExists) {
        return res
          .status(400)
          .json({ message: "Email is already in use by another account." });
      }
      user.email = email;
    }

    if (name) {
      user.name = name;
    }

    if (bio) {
      user.bio = bio;
    }

    if (country) {
      user.country = country;
    }

    if (role) {
      user.role = role;
    }

    const updatedUser = await user.save();
    const userResponse = updatedUser.toObject();
    delete userResponse.password; // Ensure password is not sent back

    res.json(userResponse);
  } catch (error) {
    console.error(`Error updating profile for user ${userId}:`, error.message);
    res.status(500).json({ message: "Server error while updating profile." });
  }
};

// @desc    Get authenticated user's Codeforces stats (and potentially sync)
// @route   GET /api/users/me/cf-stats
const getCFStats = async (req, res) => {
  const userId = req.user.id; // From authMiddleware

  try {
    //find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    //fetch latest stats from CF API
    const cfData = await codeforcesService.getUserInfo(user.codeforcesHandle);

    if (cfData) {
      // update local db if stats have changed
      let updatedInDb = false;
      if (
        user.codeforcesRating !== cfData.rating ||
        user.maxRating !== cfData.maxRating ||
        user.avatar !== cfData.avatar
      ) {
        user.codeforcesRating = cfData.rating;
        user.maxRating = cfData.maxRating;
        user.avatar = cfData.avatar;
        user.titlePhoto = cfData.titlePhoto;
        await user.save();
        updatedInDb = true;
      }

      res.json({
        codeforcesHandle: user.codeforcesHandle,
        currentRating: cfData.rating,
        maxRating: cfData.maxRating,
        rank: cfData.rank,
        maxRank: cfData.maxRank,
        avatar: user.avatar,
        lastOnlineTimeSeconds: cfData.lastOnlineTimeSeconds,
        friendOfCount: cfData.friendOfCount,
        source: "Codeforces API",
        updatedInLocalDB: updatedInDb,
        localDataLastChecked: new Date().toISOString(),
      });
    } else {
      return res
        .status(502)
        .json({ message: "Could not retrieve stats from Codeforces API." });
    }
  } catch (error) {
    console.error(`Error fetching CF stats for user ${userId}:`, error.message);
    res
      .status(500)
      .json({ message: "Server error while fetching Codeforces stats." });
  }
};

// @desc    Get authenticated user's practice contest history
// @route   GET /api/users/me/practice-history
const getPracticeHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    const practiceContests = await PracticeContest.find({
      user: userId,
    })
      .sort({ createdAt: -1 }) // Sort by most recent first
      .populate("problems.problem", "problemId name rating tags")
      .populate("leaderboard", "user score penalty rank");

    return res.json(practiceContests);
  } catch (error) {
    console.error(
      `Error fetching practice history for user ${userId}:`,
      error.message
    );
    res
      .status(500)
      .json({ message: "Server error while fetching practice history." });
  }
};

// @desc    Get authenticated user's dashboard statistics
// @route   GET /api/users/me/dashboard-stats
const getDashboardStats = async (req, res) => {
  const userId = req.user.id;

  try {
    // Get dashboard statistics using the service
    const stats = await dashboardStatsService.getDashboardStats(userId);

    // Calculate trends for each statistic
    const formattedStats = {
      problemsSolved: {
        value: stats.problemsSolved.currentMonth.count,
        trend:
          stats.problemsSolved.currentMonth.count -
          stats.problemsSolved.previousMonth.count,
      },
      rating: {
        value: stats.rating.currentMonth.value,
        trend:
          stats.rating.currentMonth.value - stats.rating.previousMonth.value,
      },
      practiceContests: {
        value: stats.practiceContests.currentMonth.count,
        trend:
          stats.practiceContests.currentMonth.count -
          stats.practiceContests.previousMonth.count,
      },
      performance: {
        value: stats.performance.currentMonth.value,
        trend:
          stats.performance.currentMonth.value -
          stats.performance.previousMonth.value,
      },
      lastUpdated: stats.lastFullUpdate,
    };

    res.json(formattedStats);
  } catch (error) {
    console.error(
      `Error fetching dashboard stats for user ${userId}:`,
      error.message
    );
    res
      .status(500)
      .json({ message: "Server error while fetching dashboard statistics." });
  }
};

// @desc    Force update of dashboard statistics
// @route   POST /api/users/me/dashboard-stats/update
const updateDashboardStats = async (req, res) => {
  const userId = req.user.id;

  try {
    // Force update of dashboard statistics
    const stats = await dashboardStatsService.updateDashboardStats(userId);

    // Calculate trends for each statistic
    const formattedStats = {
      problemsSolved: {
        value: stats.problemsSolved.currentMonth.count,
        trend:
          stats.problemsSolved.currentMonth.count -
          stats.problemsSolved.previousMonth.count,
      },
      rating: {
        value: stats.rating.currentMonth.value,
        trend:
          stats.rating.currentMonth.value - stats.rating.previousMonth.value,
      },
      practiceContests: {
        value: stats.practiceContests.currentMonth.count,
        trend:
          stats.practiceContests.currentMonth.count -
          stats.practiceContests.previousMonth.count,
      },
      performance: {
        value: stats.performance.currentMonth.value,
        trend:
          stats.performance.currentMonth.value -
          stats.performance.previousMonth.value,
      },
      lastUpdated: stats.lastFullUpdate,
    };

    res.json(formattedStats);
  } catch (error) {
    console.error(
      `Error updating dashboard stats for user ${userId}:`,
      error.message
    );
    res
      .status(500)
      .json({ message: "Server error while updating dashboard statistics." });
  }
};

// @desc    Get authenticated user's recent contests (both Codeforces and practice)
// @route   GET /api/users/me/recent-contests
const getRecentContests = async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 5;
  const forceRefresh = req.query.refresh === "true";

  try {
    // Find the user to get their Codeforces handle
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Get practice contests for this user
    const practiceContests = await PracticeContest.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    // Transform practice contests to the format we need
    const formattedPracticeContests = practiceContests.map((contest) => ({
      type: "Practice",
      id: contest._id,
      name: contest.title || "Practice Contest",
      problems: {
        solved: contest.problems.filter((p) => p.solved).length,
        total: contest.problems.length,
      },
      duration: contest.duration || 7200, // Default to 2 hours if not set
      date: contest.startTime || contest.createdAt,
      performance: contest.performance || 0,
    }));

    // Fetch real Codeforces contest history for this user
    let cfContests = [];
    if (user.codeforcesHandle) {
      // Check if we have cached contest history and it's not too old (less than 24 hours)
      const cacheExpired =
        !user.cfContestHistory?.lastUpdated ||
        new Date() - new Date(user.cfContestHistory.lastUpdated) >
          24 * 60 * 60 * 1000;

      if (
        forceRefresh ||
        cacheExpired ||
        !user.cfContestHistory?.contests?.length
      ) {
        try {
          console.log(
            `Fetching fresh Codeforces contest history for ${user.codeforcesHandle}`
          );
          const contestHistory = await codeforcesService.getUserContestHistory(
            user.codeforcesHandle
          );

          // Calculate rating changes for easier access
          const enhancedContests = contestHistory.map((contest) => ({
            ...contest,
            ratingChange: contest.newRating - contest.oldRating,
          }));

          // Save to cache
          user.cfContestHistory = {
            contests: enhancedContests,
            lastUpdated: new Date(),
          };
          await user.save();

          // Transform for the response using our Contest model for accurate problem counts
          cfContests = await formatContestsWithAccurateProblemCounts(
            enhancedContests.slice(0, limit)
          );
        } catch (error) {
          console.error(
            `Error fetching CF contest history for ${user.codeforcesHandle}:`,
            error.message
          );
          // If we have cached data, use it even if it's expired
          if (user.cfContestHistory?.contests?.length) {
            cfContests = await formatContestsWithAccurateProblemCounts(
              user.cfContestHistory.contests.slice(0, limit)
            );
          }
        }
      } else {
        console.log(
          `Using cached Codeforces contest history for ${user.codeforcesHandle}`
        );
        cfContests = await formatContestsWithAccurateProblemCounts(
          user.cfContestHistory.contests.slice(0, limit)
        );
      }
    }

    // Combine both types of contests and sort by date
    const allContests = [...formattedPracticeContests, ...cfContests]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);

    res.json(allContests);
  } catch (error) {
    console.error(
      `Error fetching recent contests for user ${userId}:`,
      error.message
    );
    res
      .status(500)
      .json({ message: "Server error while fetching recent contests." });
  }
};

// Helper function to format contest data with accurate problem counts
const formatContestsWithAccurateProblemCounts = async (contests) => {
  // Get all contest IDs
  const contestIds = contests.map((contest) => contest.contestId);

  // Fetch contests from our database to get problem counts
  const dbContests = await Contest.find({ contestId: { $in: contestIds } })
    .select("contestId problems")
    .populate("problems");

  // Create a map for quick lookup
  const contestMap = new Map();
  dbContests.forEach((contest) => {
    contestMap.set(
      contest.contestId,
      contest.problems ? contest.problems.length : 0
    );
  });

  // Format the contests with accurate problem counts where available
  return contests.map((contest) => {
    // Get problem count from our database, or use a reasonable default
    const totalProblems = contestMap.get(contest.contestId) || 6;

    // Estimate solved problems based on rating change
    // More sophisticated logic could be implemented here
    let solvedProblems;
    const ratingChange = contest.newRating - contest.oldRating;

    if (ratingChange > 100) {
      solvedProblems = Math.floor(totalProblems * 0.8); // Solved most problems
    } else if (ratingChange > 0) {
      solvedProblems = Math.floor(totalProblems * 0.6); // Solved more than half
    } else if (ratingChange > -100) {
      solvedProblems = Math.floor(totalProblems * 0.4); // Solved less than half
    } else {
      solvedProblems = Math.floor(totalProblems * 0.2); // Solved few problems
    }

    // Ensure solved is never more than total
    solvedProblems = Math.min(solvedProblems, totalProblems);

    return {
      type: "Codeforces",
      id: contest.contestId.toString(),
      name: contest.contestName,
      problems: {
        solved: solvedProblems,
        total: totalProblems,
      },
      duration: contest.durationSeconds || 7200,
      date: new Date(contest.ratingUpdateTimeSeconds * 1000),
      rating:
        contest.ratingChange > 0
          ? `+${contest.ratingChange}`
          : `${contest.ratingChange}`,
    };
  });
};

module.exports = {
  getProfile,
  updateProfile,
  getCFStats,
  getPracticeHistory,
  getDashboardStats,
  updateDashboardStats,
  getRecentContests,
};
