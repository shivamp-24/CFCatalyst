const User = require("../models/User");
const PracticeContest = require("../models/PracticeContest");
const codeforcesService = require("./codeforcesService");

/**
 * Updates dashboard statistics for a user
 * @param {string} userId - The user's MongoDB ID
 * @returns {Object} Updated dashboard statistics
 */
const updateDashboardStats = async (userId) => {
  try {
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    // Initialize dashboard stats if not present
    if (!user.dashboardStats) {
      user.dashboardStats = {
        problemsSolved: {
          currentMonth: { count: 0, lastUpdated: now },
          previousMonth: { count: 0, lastUpdated: now },
        },
        rating: {
          currentMonth: { value: user.codeforcesRating || 0, lastUpdated: now },
          previousMonth: {
            value: user.codeforcesRating || 0,
            lastUpdated: now,
          },
        },
        practiceContests: {
          currentMonth: { count: 0, lastUpdated: now },
          previousMonth: { count: 0, lastUpdated: now },
        },
        performance: {
          currentMonth: { value: 0, lastUpdated: now },
          previousMonth: { value: 0, lastUpdated: now },
        },
        lastFullUpdate: now,
      };
    }

    // 1. Update problems solved statistics
    await updateProblemsSolvedStats(
      user,
      currentMonthStart,
      previousMonthStart
    );

    // 2. Update rating statistics
    await updateRatingStats(user);

    // 3. Update practice contests statistics
    await updatePracticeContestsStats(
      user,
      currentMonthStart,
      previousMonthStart
    );

    // 4. Update performance statistics
    await updatePerformanceStats(user, currentMonthStart, previousMonthStart);

    // Update the last full update timestamp
    user.dashboardStats.lastFullUpdate = now;
    await user.save();

    return user.dashboardStats;
  } catch (error) {
    console.error("Error updating dashboard stats:", error);
    throw error;
  }
};

/**
 * Updates the problems solved statistics for a user
 */
const updateProblemsSolvedStats = async (
  user,
  currentMonthStart,
  previousMonthStart
) => {
  try {
    // Get user submissions from Codeforces
    const submissions = await codeforcesService.getUserSubmissions(
      user.codeforcesHandle
    );

    // Filter accepted submissions
    const acceptedSubmissions = submissions.filter(
      (sub) => sub.verdict === "OK"
    );

    // Count unique problems solved in current month
    const currentMonthProblems = new Set();
    const previousMonthProblems = new Set();

    acceptedSubmissions.forEach((sub) => {
      const submissionDate = new Date(sub.creationTimeSeconds * 1000);
      const problemId = `${sub.problem.contestId}${sub.problem.index}`;

      if (submissionDate >= currentMonthStart) {
        currentMonthProblems.add(problemId);
      } else if (
        submissionDate >= previousMonthStart &&
        submissionDate < currentMonthStart
      ) {
        previousMonthProblems.add(problemId);
      }
    });

    // Update the statistics
    user.dashboardStats.problemsSolved.currentMonth = {
      count: currentMonthProblems.size,
      lastUpdated: new Date(),
    };

    user.dashboardStats.problemsSolved.previousMonth = {
      count: previousMonthProblems.size,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error("Error updating problems solved stats:", error);
    // Don't throw error to allow other stats to update
  }
};

/**
 * Updates the rating statistics for a user
 */
const updateRatingStats = async (user) => {
  try {
    // Get current rating from Codeforces
    const cfData = await codeforcesService.getUserInfo(user.codeforcesHandle);

    // Store the previous month's rating before updating
    const previousMonthRating = user.dashboardStats.rating.currentMonth.value;

    // Update current month rating
    user.dashboardStats.rating.currentMonth = {
      value: cfData.rating || user.codeforcesRating || 0,
      lastUpdated: new Date(),
    };

    // Move current month rating to previous month
    user.dashboardStats.rating.previousMonth = {
      value: previousMonthRating,
      lastUpdated: new Date(),
    };

    // Update user's rating in the main profile
    if (user.codeforcesRating !== cfData.rating) {
      user.codeforcesRating = cfData.rating || 0;
    }
  } catch (error) {
    console.error("Error updating rating stats:", error);
    // Don't throw error to allow other stats to update
  }
};

/**
 * Updates the practice contests statistics for a user
 */
const updatePracticeContestsStats = async (
  user,
  currentMonthStart,
  previousMonthStart
) => {
  try {
    // Get user's practice contests
    const practiceContests = await PracticeContest.find({
      user: user._id,
      status: "COMPLETED",
    });

    // Count contests in current and previous month
    const currentMonthContests = practiceContests.filter(
      (contest) => new Date(contest.endTime) >= currentMonthStart
    ).length;

    const previousMonthContests = practiceContests.filter(
      (contest) =>
        new Date(contest.endTime) >= previousMonthStart &&
        new Date(contest.endTime) < currentMonthStart
    ).length;

    // Update the statistics
    user.dashboardStats.practiceContests.currentMonth = {
      count: currentMonthContests,
      lastUpdated: new Date(),
    };

    user.dashboardStats.practiceContests.previousMonth = {
      count: previousMonthContests,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error("Error updating practice contests stats:", error);
    // Don't throw error to allow other stats to update
  }
};

/**
 * Updates the performance statistics for a user
 */
const updatePerformanceStats = async (
  user,
  currentMonthStart,
  previousMonthStart
) => {
  try {
    // Get user's practice contests
    const practiceContests = await PracticeContest.find({
      user: user._id,
      status: "COMPLETED",
    });

    // Calculate average performance for current month
    const currentMonthContests = practiceContests.filter(
      (contest) => new Date(contest.endTime) >= currentMonthStart
    );

    const previousMonthContests = practiceContests.filter(
      (contest) =>
        new Date(contest.endTime) >= previousMonthStart &&
        new Date(contest.endTime) < currentMonthStart
    );

    let currentMonthPerformance = 0;
    let previousMonthPerformance = 0;

    // Calculate current month performance
    if (currentMonthContests.length > 0) {
      // Calculate percentage of problems solved
      let totalProblems = 0;
      let totalSolved = 0;

      currentMonthContests.forEach((contest) => {
        totalProblems += contest.problems.length;
        totalSolved += contest.problems.filter((p) => p.solved).length;
      });

      currentMonthPerformance =
        totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;
    }

    // Calculate previous month performance
    if (previousMonthContests.length > 0) {
      // Calculate percentage of problems solved
      let totalProblems = 0;
      let totalSolved = 0;

      previousMonthContests.forEach((contest) => {
        totalProblems += contest.problems.length;
        totalSolved += contest.problems.filter((p) => p.solved).length;
      });

      previousMonthPerformance =
        totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;
    }

    // Update the statistics
    user.dashboardStats.performance.currentMonth = {
      value: currentMonthPerformance,
      lastUpdated: new Date(),
    };

    user.dashboardStats.performance.previousMonth = {
      value: previousMonthPerformance,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error("Error updating performance stats:", error);
    // Don't throw error to allow other stats to update
  }
};

/**
 * Gets dashboard statistics for a user
 * @param {string} userId - The user's MongoDB ID
 * @returns {Object} Dashboard statistics
 */
const getDashboardStats = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if stats need to be updated (older than 24 hours)
    const needsUpdate =
      !user.dashboardStats?.lastFullUpdate ||
      new Date() - new Date(user.dashboardStats.lastFullUpdate) >
        24 * 60 * 60 * 1000;

    if (needsUpdate) {
      return await updateDashboardStats(userId);
    }

    return user.dashboardStats;
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    throw error;
  }
};

module.exports = {
  updateDashboardStats,
  getDashboardStats,
};
