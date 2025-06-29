const PracticeContest = require("../models/PracticeContest");
const User = require("../models/User");
const Contest = require("../models/Contest");
const codeforcesService = require("../services/codeforcesService");
const dashboardStatsService = require("../services/dashboardStatsService");
const { getUserWeakTopics } = require("../utils/problemSelection");

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
    const formattedPracticeContests = practiceContests.map((contest) => {
      // Calculate performance percentage and rating
      const solvedCount = contest.problems.filter((p) => p.solved).length;
      const totalProblems = contest.problems.length;
      const performancePercentage =
        totalProblems > 0 ? Math.round((solvedCount / totalProblems) * 100) : 0;

      // Use the actual performance rating if available, otherwise calculate it
      const performanceRating =
        contest.userPerformanceRating ||
        Math.round(1500 + (performancePercentage - 50) * 10);

      return {
        type: "Practice",
        id: contest._id,
        name: contest.title || "Practice Contest",
        problems: {
          solved: solvedCount,
          total: totalProblems,
        },
        duration: contest.durationMinutes * 60 || 7200, // Convert minutes to seconds, default to 2 hours if not set
        date: contest.startTime || contest.createdAt,
        performance: performancePercentage,
        performanceRating: performanceRating,
      };
    });

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

// @desc    Get user's weak topics based on submission history
// @route   GET /api/users/me/weak-topics
const getWeakTopics = async (req, res) => {
  const userId = req.user.id;
  const { refresh } = req.query; // Optional query param to force refresh

  try {
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if we need to refresh weak topics
    const needsRefresh =
      refresh === "true" ||
      !user.weakTopics ||
      !user.weakTopics.lastUpdated ||
      !user.weakTopics.topics ||
      user.weakTopics.topics.length === 0 ||
      // Refresh if older than 24 hours
      new Date() - new Date(user.weakTopics.lastUpdated) > 24 * 60 * 60 * 1000;

    let weakTopics = [];

    if (needsRefresh) {
      // Get weak topics using the utility function
      weakTopics = await getUserWeakTopics(user.codeforcesHandle);

      // Log the weak topics data to debug
      console.log(
        `Weak topics data for ${user.codeforcesHandle}:`,
        JSON.stringify(weakTopics)
      );

      // Ensure the data is in the correct format
      const formattedTopics = weakTopics.map((topic) => ({
        name: topic.name,
        successRate: topic.successRate,
        total: topic.total,
        accepted: topic.accepted,
        rejected: topic.rejected,
      }));

      // Update user model with the new weak topics
      user.weakTopics = {
        topics: formattedTopics,
        lastUpdated: new Date(),
      };

      await user.save();

      // Use the formatted topics
      weakTopics = formattedTopics;

      console.log(
        `Refreshed weak topics for user ${userId}. Data saved:`,
        JSON.stringify(user.weakTopics)
      );
    } else {
      // Use cached weak topics
      weakTopics = user.weakTopics.topics || [];
      console.log(
        `Using cached weak topics for user ${userId} from ${user.weakTopics.lastUpdated}. Data:`,
        JSON.stringify(weakTopics)
      );
    }

    // Add status to each topic
    const topicsWithStatus = weakTopics.map((topic) => ({
      ...topic,
      status: getTopicStatus(topic.successRate),
    }));

    res.json({
      weakTopics: topicsWithStatus,
      lastUpdated: user.weakTopics.lastUpdated,
      fromCache: !needsRefresh,
    });
  } catch (error) {
    console.error(
      `Error fetching weak topics for user ${userId}:`,
      error.message
    );
    res
      .status(500)
      .json({ message: "Server error while fetching weak topics." });
  }
};

// Helper function to determine topic status based on success rate
const getTopicStatus = (successRate) => {
  if (successRate < 50) return "critical";
  if (successRate < 60) return "poor";
  if (successRate < 70) return "needs-improvement";
  return "average";
};

// @desc    Get authenticated user's all contests with filtering options
// @route   GET /api/users/me/all-contests
const getAllContests = async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const pageSize = 20; // Fixed page size of 20 contests per page
  const forceRefresh = req.query.refresh === "true"; // This will refresh both contests and submissions
  const timeFilter = req.query.timeFilter || "all-time";
  const sortBy = req.query.sortBy || "date-desc";
  const contestType = req.query.contestType || "all";

  try {
    // Find the user to get their Codeforces handle
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Get practice contests for this user (no limit initially, we'll filter later)
    let practiceContestsQuery = PracticeContest.find({ user: userId });

    // Populate problems to get detailed information
    practiceContestsQuery = practiceContestsQuery.populate({
      path: "problems.problem",
      select: "problemId name rating tags index contestId",
    });

    const practiceContests = await practiceContestsQuery.exec();

    // Transform practice contests to the format we need
    const formattedPracticeContests = practiceContests.map((contest) => {
      // Calculate performance percentage
      const solvedCount = contest.problems.filter((p) => p.solved).length;
      const totalProblems = contest.problems.length;
      const performancePercentage =
        totalProblems > 0 ? Math.round((solvedCount / totalProblems) * 100) : 0;

      // Format problems for display
      let formattedProblems = contest.problems.map((problemEntry) => {
        const problem = problemEntry.problem;

        // For practice contests, we can get real data from the database
        // We already track solve time and editorial access accurately

        // Get attempts from the Submission collection if available
        // For now, we'll use the data we have in the problem entry
        const attempts =
          problemEntry.attempts ||
          problemEntry.submissions?.length ||
          (problemEntry.solved ? 1 : 0);

        return {
          id: problem.index,
          title: problem.name,
          rating: problem.rating || "Unrated",
          status: problemEntry.solved ? "AC" : "Unsolved",
          timeSpent: problemEntry.userSolveTimeSeconds
            ? formatTimeFromSeconds(problemEntry.userSolveTimeSeconds)
            : "0:00:00",
          attempts: attempts,
          editorialAccessed: problemEntry.editorialAccessed,
          problemId: problem._id,
        };
      });

      // Sort problems by index (A, B, C, etc.) for consistency with CF contests
      formattedProblems.sort((a, b) => {
        // Compare the first character (usually a letter)
        return a.id.localeCompare(b.id);
      });

      return {
        type: "Practice",
        id: contest._id,
        name: `Practice Contest (${new Date(
          contest.createdAt
        ).toLocaleDateString()})`,
        problems: {
          solved: solvedCount,
          total: totalProblems,
          details: formattedProblems,
        },
        duration: contest.durationMinutes * 60,
        durationFormatted: formatTimeFromMinutes(contest.durationMinutes),
        date: contest.startTime || contest.createdAt,
        performance: performancePercentage,
        performanceRating:
          contest.userPerformanceRating ||
          Math.round(1500 + (performancePercentage - 50) * 10),
        rank: null, // Practice contests don't have ranks
        status: contest.status,
      };
    });

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

          // Get user submissions to pass to the format function
          let userSubmissions = [];

          // Check if we need to refresh submissions or if we have cached submissions
          const submissionsCacheExpired =
            !user.cfSubmissions?.lastUpdated ||
            new Date() - new Date(user.cfSubmissions.lastUpdated) >
              24 * 60 * 60 * 1000;

          if (
            forceRefresh ||
            submissionsCacheExpired ||
            !user.cfSubmissions?.submissions?.length
          ) {
            try {
              console.log(
                `Fetching fresh Codeforces submissions for ${user.codeforcesHandle}`
              );
              userSubmissions = await codeforcesService.getUserSubmissions(
                user.codeforcesHandle
              );

              // Save to cache
              user.cfSubmissions = {
                submissions: userSubmissions,
                lastUpdated: new Date(),
              };
              await user.save();

              console.log(
                `Fetched and cached ${userSubmissions.length} submissions for user ${user.codeforcesHandle}`
              );
            } catch (error) {
              console.error(
                `Error fetching submissions for user ${user.codeforcesHandle}:`,
                error.message
              );

              // If we have cached data, use it even if it's expired
              if (user.cfSubmissions?.submissions?.length) {
                userSubmissions = user.cfSubmissions.submissions;
                console.log(
                  `Using ${userSubmissions.length} cached submissions for ${user.codeforcesHandle}`
                );
              }
            }
          } else {
            // Use cached submissions
            userSubmissions = user.cfSubmissions.submissions;
            console.log(
              `Using ${userSubmissions.length} cached submissions for ${user.codeforcesHandle}`
            );
          }

          // Transform for the response using our Contest model for accurate problem counts
          cfContests = await formatContestsForHistory(
            enhancedContests,
            user,
            userSubmissions
          );
        } catch (error) {
          console.error(
            `Error fetching CF contest history for ${user.codeforcesHandle}:`,
            error.message
          );
          // If we have cached data, use it even if it's expired
          if (user.cfContestHistory?.contests?.length) {
            // Get user submissions from cache if available
            let userSubmissions = [];
            if (user.cfSubmissions?.submissions?.length) {
              userSubmissions = user.cfSubmissions.submissions;
              console.log(
                `Using ${userSubmissions.length} cached submissions for ${user.codeforcesHandle}`
              );
            }

            cfContests = await formatContestsForHistory(
              user.cfContestHistory.contests,
              user,
              userSubmissions
            );
          }
        }
      } else {
        console.log(
          `Using cached Codeforces contest history for ${user.codeforcesHandle}`
        );
        // Get user submissions from cache if available
        let userSubmissions = [];
        if (user.cfSubmissions?.submissions?.length) {
          userSubmissions = user.cfSubmissions.submissions;
          console.log(
            `Using ${userSubmissions.length} cached submissions for ${user.codeforcesHandle}`
          );
        }

        cfContests = await formatContestsForHistory(
          user.cfContestHistory.contests,
          user,
          userSubmissions
        );
      }
    }

    // Apply time filter
    let filteredContests = [...formattedPracticeContests, ...cfContests];

    if (timeFilter !== "all-time") {
      const now = new Date();
      let cutoffDate = new Date();

      switch (timeFilter) {
        case "last-month":
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case "last-3-months":
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case "last-year":
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filteredContests = filteredContests.filter(
        (contest) => new Date(contest.date) >= cutoffDate
      );
    }

    // Apply contest type filter
    if (contestType !== "all") {
      filteredContests = filteredContests.filter(
        (contest) => contest.type.toLowerCase() === contestType.toLowerCase()
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "date-asc":
        filteredContests.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case "date-desc":
        filteredContests.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case "performance-desc":
        filteredContests.sort((a, b) => {
          // For CF contests, use rating change; for practice, use performance
          const aValue =
            a.type === "Codeforces"
              ? parseInt(a.rating?.replace(/[+]/g, "") || 0)
              : a.performanceRating || 0;
          const bValue =
            b.type === "Codeforces"
              ? parseInt(b.rating?.replace(/[+]/g, "") || 0)
              : b.performanceRating || 0;
          return bValue - aValue;
        });
        break;
      case "performance-asc":
        filteredContests.sort((a, b) => {
          const aValue =
            a.type === "Codeforces"
              ? parseInt(a.rating?.replace(/[+]/g, "") || 0)
              : a.performanceRating || 0;
          const bValue =
            b.type === "Codeforces"
              ? parseInt(b.rating?.replace(/[+]/g, "") || 0)
              : b.performanceRating || 0;
          return aValue - bValue;
        });
        break;
    }

    // Calculate pagination
    const totalContests = filteredContests.length;
    const totalPages = Math.ceil(totalContests / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalContests);

    // Get contests for current page
    const paginatedContests = filteredContests.slice(startIndex, endIndex);

    // Get statistics for the overview section
    const stats = {
      totalContests: formattedPracticeContests.length + cfContests.length,
      averageProblemsPerContest: calculateAverageProblems(
        formattedPracticeContests,
        cfContests
      ),
      currentRating: user.codeforcesRating || 0,
      lastPerformance: getLastPerformance(
        formattedPracticeContests,
        cfContests
      ),
    };

    // Add pagination metadata
    const pagination = {
      currentPage: page,
      totalPages,
      pageSize,
      totalContests,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    res.json({
      contests: paginatedContests,
      stats,
      pagination,
    });
  } catch (error) {
    console.error(
      `Error fetching all contests for user ${userId}:`,
      error.message
    );
    res.status(500).json({ message: "Server error while fetching contests." });
  }
};

// Helper function to format contests for history view with more details
const formatContestsForHistory = async (
  contests,
  user,
  userSubmissions = []
) => {
  // We now receive userSubmissions as a parameter
  // Get all contest IDs
  const contestIds = contests.map((contest) => contest.contestId);

  // Fetch contests from our database to get problem counts and details
  const dbContests = await Contest.find({ contestId: { $in: contestIds } })
    .select("contestId problems")
    .populate("problems");

  // Create a map for quick lookup
  const contestMap = new Map();
  dbContests.forEach((contest) => {
    contestMap.set(contest.contestId, contest);
  });

  // Format the contests with detailed information
  return contests.map((contest) => {
    const dbContest = contestMap.get(contest.contestId);
    const totalProblems = dbContest?.problems?.length || 6;
    const ratingChange = contest.newRating - contest.oldRating;

    // Estimate solved problems based on rating change
    let solvedProblems;
    if (ratingChange > 100) {
      solvedProblems = Math.floor(totalProblems * 0.8);
    } else if (ratingChange > 0) {
      solvedProblems = Math.floor(totalProblems * 0.6);
    } else if (ratingChange > -100) {
      solvedProblems = Math.floor(totalProblems * 0.4);
    } else {
      solvedProblems = Math.floor(totalProblems * 0.2);
    }
    solvedProblems = Math.min(solvedProblems, totalProblems);

    // Create problem details
    let problemDetails = [];
    if (dbContest && dbContest.problems) {
      // Filter submissions for this specific contest from the pre-fetched submissions
      const contestSubmissions = userSubmissions.filter(
        (sub) => sub.contestId === contest.contestId
      );

      console.log(
        `Found ${contestSubmissions.length} submissions for contest ${contest.contestId}`
      );

      // Create a map of problem index to submission data
      const problemSubmissionMap = new Map();

      // Process submissions to get attempts and solve time for each problem
      contestSubmissions.forEach((submission) => {
        if (!submission.problem || !submission.problem.index) return;

        const problemIndex = submission.problem.index;

        if (!problemSubmissionMap.has(problemIndex)) {
          problemSubmissionMap.set(problemIndex, {
            attempts: 0,
            solved: false,
            solveTimeSeconds: null,
            lastSubmissionTime: null,
          });
        }

        const problemData = problemSubmissionMap.get(problemIndex);
        problemData.attempts++;

        // If this submission was accepted and the problem wasn't already marked as solved
        if (submission.verdict === "OK" && !problemData.solved) {
          problemData.solved = true;

          // Calculate relative time from contest start
          if (submission.creationTimeSeconds && contest.startTimeSeconds) {
            problemData.solveTimeSeconds =
              submission.creationTimeSeconds - contest.startTimeSeconds;
          }
        }

        // Track the last submission time
        if (
          !problemData.lastSubmissionTime ||
          submission.creationTimeSeconds > problemData.lastSubmissionTime
        ) {
          problemData.lastSubmissionTime = submission.creationTimeSeconds;
        }
      });

      // Map problems with actual submission data
      problemDetails = dbContest.problems.map((problem) => {
        const submissionData = problemSubmissionMap.get(problem.index);

        // If we have submission data for this problem
        if (submissionData) {
          // Format time spent based on actual solve time
          let timeSpent = "N/A";
          if (submissionData.solveTimeSeconds) {
            timeSpent = formatTimeFromSeconds(submissionData.solveTimeSeconds);
          }

          return {
            id: problem.index,
            title: problem.name,
            rating: problem.rating || "Unrated",
            status: submissionData.solved ? "AC" : "Unsolved",
            timeSpent: timeSpent,
            attempts: submissionData.attempts || 0,
            problemId: problem._id,
          };
        } else {
          // No submission data for this problem
          return {
            id: problem.index,
            title: problem.name,
            rating: problem.rating || "Unrated",
            status: "Unsolved",
            timeSpent: "N/A",
            attempts: 0,
            problemId: problem._id,
          };
        }
      });

      // Sort problems by index (A, B, C, etc.) for Codeforces contests
      problemDetails.sort((a, b) => {
        // Compare the first character (usually a letter)
        return a.id.localeCompare(b.id);
      });
    }

    // Format contest date and time
    const contestDate = new Date(contest.ratingUpdateTimeSeconds * 1000);

    return {
      type: "Codeforces",
      id: contest.contestId.toString(),
      name: contest.contestName,
      problems: {
        solved: solvedProblems,
        total: totalProblems,
        details: problemDetails,
      },
      duration: contest.durationSeconds || 7200,
      durationFormatted: formatTimeFromSeconds(contest.durationSeconds || 7200),
      date: contestDate,
      time: contestDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      rating: ratingChange > 0 ? `+${ratingChange}` : `${ratingChange}`,
      performanceRating: contest.newRating,
      rank: contest.rank,
    };
  });
};

// Helper function to format time from seconds to HH:MM format
const formatTimeFromSeconds = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
};

// Helper function to format time from minutes to HH:MM format
const formatTimeFromMinutes = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, "0")}`;
};

// Helper function to calculate average problems per contest
const calculateAverageProblems = (practiceContests, cfContests) => {
  const totalContests = practiceContests.length + cfContests.length;
  if (totalContests === 0) return 0;

  // Calculate total solved problems across all contests
  const totalSolvedProblems =
    practiceContests.reduce(
      (sum, contest) => sum + contest.problems.solved,
      0
    ) + cfContests.reduce((sum, contest) => sum + contest.problems.solved, 0);

  return (totalSolvedProblems / totalContests).toFixed(1);
};

// Helper function to get the last performance (rating change or percentage)
const getLastPerformance = (practiceContests, cfContests) => {
  const allContests = [...practiceContests, ...cfContests].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  if (allContests.length === 0) return 0;

  const lastContest = allContests[0];
  if (lastContest.type === "Codeforces") {
    // For Codeforces contests, return the rating change
    return parseInt(lastContest.rating?.replace(/[+]/g, "") || 0);
  } else {
    // For practice contests, return the performance rating
    // First try to get the calculated performance rating
    if (lastContest.performanceRating) {
      return lastContest.performanceRating;
    }
    // If not available, calculate based on solved problems percentage
    const solvedPercentage =
      (lastContest.problems.solved / lastContest.problems.total) * 100;
    return Math.round(1500 + (solvedPercentage - 50) * 10);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getCFStats,
  getPracticeHistory,
  getDashboardStats,
  updateDashboardStats,
  getRecentContests,
  getWeakTopics,
  getAllContests,
};
