const PracticeContest = require("../models/PracticeContest");
const User = require("../models/User");
const problemSelection = require("../utils/problemSelection");
const ratingCalculation = require("../utils/ratingCalculation");
const codeforcesService = require("../services/codeforcesService");

// @desc    Generate a new practice contest
// @route   POST /api/practice-contests/generate
const generatePracticeContest = async (req, res) => {
  const {
    generationMode, // "GENERAL", "USER_TAGS", "WEAK_TOPIC", "CONTEST_SIMULATION"
    userMinRating: rawUserMinRating,
    userMaxRating: rawUserMaxRating,
    userSpecifiedTags,
    problemCount = 5,
    durationMinutes = 120, // Default duration
    targetContestFormat, // "Div. 2", "Div. 3", "Div. 4", "Educational Div.2" - for CONTEST_SIMULATION mode
  } = req.body;

  try {
    // Validate input
    if (!generationMode) {
      return res.status(400).json({ message: "generationMode is required." });
    }

    const numProblemCount = parseInt(problemCount);
    if (
      isNaN(numProblemCount) ||
      numProblemCount <= 0 ||
      numProblemCount > 10
    ) {
      return res.status(400).json({
        message: "problemCount must be a positive number between 1 and 10.",
      });
    }

    const parsedUserMinRating = rawUserMinRating
      ? parseInt(rawUserMinRating)
      : undefined;
    const parsedUserMaxRating = rawUserMaxRating
      ? parseInt(rawUserMaxRating)
      : undefined;

    if (
      parsedUserMinRating !== undefined &&
      parsedUserMaxRating !== undefined &&
      parsedUserMinRating > parsedUserMaxRating
    ) {
      return res
        .status(400)
        .json({ message: "userMinRating cannot exceed userMaxRating." });
    }
    if (
      generationMode.toUpperCase() === "CONTEST_SIMULATION" &&
      !targetContestFormat
    ) {
      return res.status(400).json({
        message: "targetContestFormat is required for CONTEST_SIMULATION mode.",
      });
    }

    //check if user exists and then, populate practiceContestHistory
    const user = await User.findById(req.user.id);
    if (!user || !user.codeforcesHandle) {
      return res
        .status(404)
        .json({ message: "User not found or Codeforces handle is missing." });
    }

    console.log("Requesting problem selection with params:", {
      handle: user.codeforcesHandle,
      mode: generationMode,
      count: numProblemCount,
      minRating: parsedUserMinRating,
      maxRating: parsedUserMaxRating,
      tags: userSpecifiedTags,
      format: targetContestFormat,
    });

    // fetch the problems from logic in problemSelection
    const selectionResult = await problemSelection.selectProblems(
      user.codeforcesHandle,
      generationMode, // The mode requested by the user
      numProblemCount,
      parsedUserMinRating,
      parsedUserMaxRating,
      userSpecifiedTags,
      targetContestFormat
    );

    console.log(
      "Selection result received:",
      selectionResult
        ? selectionResult.error
          ? "Has error"
          : "No error, problem count: " +
            (selectionResult.problems?.length || 0)
        : "undefined"
    );

    // Check if selectionResult exists and if there was an error during selection
    if (!selectionResult) {
      return res.status(500).json({
        message: "Problem selection failed. Please try again later.",
      });
    }

    if (selectionResult.error) {
      return res.status(400).json({
        message: selectionResult.error,
      });
    }

    // Extract problems from the result
    const selectedProblemsFromUtil = selectionResult.problems;

    if (!selectedProblemsFromUtil || selectedProblemsFromUtil.length === 0) {
      return res.status(404).json({
        message:
          "Could not find suitable problems matching your criteria. Please try adjusting.",
      });
    }

    // Sort problems by rating in ascending order
    const sortedProblems = [...selectedProblemsFromUtil].sort((a, b) => {
      // Handle cases where rating might be missing
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      return ratingA - ratingB;
    });

    console.log(
      "Problems sorted by rating in ascending order:",
      sortedProblems.map((p) => ({ name: p.name, rating: p.rating }))
    );

    // Construct detailed contestTypeParams using details from selectionResult
    const contestTypeParams = {
      requestedGenerationMode: generationMode.toUpperCase(), // Mode user asked for
      executedGenerationMode: selectionResult.generationModeUsed, // Mode actually run (could be fallback)
      requestedProblemCount: numProblemCount,
      actualProblemCount: selectedProblemsFromUtil.length,

      // User's direct input for ratings
      userProvidedMinRating: parsedUserMinRating,
      userProvidedMaxRating: parsedUserMaxRating,

      // Actual effective ratings used by problemSelection
      effectiveMinRatingUsed: selectionResult.effectiveMinRatingUsed,
      effectiveMaxRatingUsed: selectionResult.effectiveMaxRatingUsed,
    };

    // Add mode-specific details from selectionResult
    if (selectionResult.userSpecifiedTagsUsed) {
      contestTypeParams.userSpecifiedTags =
        selectionResult.userSpecifiedTagsUsed;
    }
    if (selectionResult.targetedWeakTopics) {
      contestTypeParams.targetedWeakTopics = selectionResult.targetedWeakTopics;
    }
    if (selectionResult.generationModeUsed === "CONTEST_SIMULATION") {
      contestTypeParams.targetContestFormatUsed =
        selectionResult.targetContestFormatUsed;
      if (selectionResult.profileDetails) {
        contestTypeParams.simulationProfileSummary =
          selectionResult.profileDetails;
      }
      if (selectionResult.wasFallbackToGeneralMode) {
        contestTypeParams.simulationFellBackToGeneral = true;
      }
    }

    const practiceContest = new PracticeContest({
      user: req.user.id,
      problems: sortedProblems.map((p) => ({
        problem: p._id,
      })),
      durationMinutes: parseInt(durationMinutes),
      status: "PENDING",
      contestTypeParams,
    });

    await practiceContest.save();

    // Update user's practiceContestHistory
    if (
      user.practiceContestHistory &&
      Array.isArray(user.practiceContestHistory)
    ) {
      user.practiceContestHistory.push(practiceContest._id);
    } else {
      user.practiceContestHistory = [practiceContest._id];
    }
    await user.save();

    // Populate problem details for the response
    const populatedContest = await PracticeContest.findById(practiceContest._id)
      .populate("user", "codeforcesHandle name")
      .populate({
        path: "problems.problem",
        select: "problemId name rating tags contestId index points",
      });

    res.status(201).json({
      message: `Practice contest generated successfully with ${selectedProblemsFromUtil.length} problems.`,
      data: populatedContest,
    });
  } catch (error) {
    console.error(
      "[generatePracticeContest] Error:",
      error.message,
      error.stack
    );

    // Send back the error message from problemSelection if it's one of ours
    if (error.message.startsWith("[problemSelection]")) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to generate practice contest" });
  }
};

// @desc    Get a specific practice contest
// @route   GET /api/practice-contests/:practiceContestId
const getPracticeContest = async (req, res) => {
  const { practiceContestId } = req.params;
  const userId = req.user.id;

  try {
    const contest = await PracticeContest.findById(practiceContestId)
      .populate("user", "codeforcesHandle name") // Populate user details
      .populate(
        "problems.problem",
        "problemId name rating tags contestId index"
      ); // Populate problem details

    if (!contest) {
      return res.status(404).json({ message: "Practice contest not found." });
    }

    // Ensure the requesting user is the owner of the practice contest
    if (contest.user._id.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this practice contest." });
    }

    res.json(contest);
  } catch (error) {
    console.error(
      `Error fetching practice contest ${practiceContestId}:`,
      error.message
    );
    res
      .status(500)
      .json({ message: "Server error while fetching practice contest." });
  }
};

// @desc    Start a practice contest
// @route   POST /api/practice-contests/:practiceContestId/start
const startPracticeContest = async (req, res) => {
  const { practiceContestId } = req.params;
  const userId = req.user.id;

  try {
    const contest = await PracticeContest.findById(practiceContestId);

    if (!contest) {
      return res.status(404).json({ message: "Practice contest not found." });
    }
    if (contest.user.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to start this contest." });
    }
    if (contest.status !== "PENDING") {
      return res.status(400).json({
        message: `Contest is not pending. Current status: ${contest.status}`,
      });
    }

    contest.status = "ONGOING";
    contest.startTime = new Date();
    const durationMs = contest.durationMinutes * 60 * 1000;
    contest.endTime = new Date(contest.startTime.getTime() + durationMs);

    await contest.save();

    const populatedContest = await PracticeContest.findById(contest._id)
      .populate("user", "codeforcesHandle name")
      .populate(
        "problems.problem",
        "problemId name rating tags contestId index"
      );

    res.json(populatedContest);
  } catch (error) {
    console.error(
      `Error starting practice contest ${practiceContestId}:`,
      error.message
    );
    res
      .status(500)
      .json({ message: "Server error while starting practice contest." });
  }
};

// @desc    Complete or submit a practice contest
// @route   POST /api/practice-contests/:practiceContestId/complete
const completePracticeContest = async (req, res) => {
  const { practiceContestId } = req.params;
  const userId = req.user.id;
  const { problemSolutions } = req.body; // Expected: Array of { problemId (ObjectId), solved (bool), userSolveTimeSeconds (num) }

  try {
    const contest = await PracticeContest.findById(practiceContestId);

    if (!contest) {
      return res.status(404).json({ message: "Practice contest not found." });
    }
    if (contest.user.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to complete this contest." });
    }
    if (contest.status !== "ONGOING") {
      // Allow completing if already COMPLETED (e.g. re-evaluating) but not PENDING
      if (contest.status === "PENDING") {
        return res.status(400).json({
          message: "Contest must be started before it can be completed.",
        });
      }
      if (contest.status !== "COMPLETED") {
        // if not ONGOING or COMPLETED
        console.warn(
          `Attempting to complete contest ${practiceContestId} with status ${contest.status}`
        );
      }
    }

    contest.status = "COMPLETED";
    // If contest duration has passed, endTime is fixed. If completed early, set endTime to now.
    const now = new Date();
    if (contest.endTime > now) {
      contest.endTime = now;
    }

    // Update problem solutions if provided
    if (problemSolutions && Array.isArray(problemSolutions)) {
      problemSolutions.forEach((solution) => {
        const problemInContest = contest.problems.find(
          (p) => p.problem.toString() === solution.problemId
        );
        if (problemInContest) {
          //update solved status
          if (typeof solution.solved === "boolean") {
            problemInContest.solved = solution.solved;
          }
          //update solve time taken
          if (typeof solution.userSolveTimeSeconds === "number") {
            problemInContest.userSolveTimeSeconds =
              solution.userSolveTimeSeconds;
          }
        }
      });
    }

    // calculate performanceRating and ratingChange of user
    contest.userPerformanceRating =
      ratingCalculation.calculatePerformanceRating(contest);

    contest.userRatingChange = ratingCalculation.calculateRatingChange(
      contest.userPerformanceRating,
      contest.contestTypeParams
    );

    // Update leaderboard (single-user for now)
    contest.leaderboard = [
      {
        user: req.user.id,
        //for now each solved problem has score 100 -> need to check the score of each problem and then update score accordingly
        score: contest.problems.filter((p) => p.solved).length * 100,
        penalty:
          contest.problems.filter((p) => p.editorialAccessed).length * 50,
        rank: 1,
      },
    ];

    //save, populate and return
    await contest.save();

    const populatedContest = await PracticeContest.findById(contest._id)
      .populate("user", "codeforcesHandle name")
      .populate(
        "problems.problem",
        "problemId name rating tags contestId index"
      );

    res.json(populatedContest);
  } catch (error) {
    console.error(
      `Error completing practice contest ${practiceContestId}:`,
      error.message
    );
    res
      .status(500)
      .json({ message: "Server error while completing practice contest." });
  }
};

// @desc    Flag that user accessed editorial for a problem in a practice contest
// @route   PUT /api/practice-contests/:practiceContestId/problems/:problemObjectId/editorial
const flagEditorialAccess = async (req, res) => {
  const { practiceContestId, problemObjectId } = req.params;
  const userId = req.user.id;

  try {
    const contest = await PracticeContest.findById(practiceContestId);

    if (!contest) {
      return res.status(404).json({ message: "Practice contest not found." });
    }
    if (contest.user.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized for this contest." });
    }

    const problemToUpdate = contest.problems.find(
      (p) => p.problem.toString() === problemObjectId
    );

    if (!problemToUpdate) {
      return res
        .status(404)
        .json({ message: "Problem not found in this practice contest." });
    }

    problemToUpdate.editorialAccessed = true;
    await contest.save();

    res.json({
      message: "Editorial access flagged successfully.",
      problemId: problemObjectId,
      editorialAccessed: true,
    });
  } catch (error) {
    console.error(
      `Error flagging editorial access for problem ${problemObjectId} in contest ${practiceContestId}:`,
      error.message
    );
    res
      .status(500)
      .json({ message: "Server error while flagging editorial access." });
  }
};

// @desc    Get leaderboard for a practice contest (Placeholder - depends on how leaderboard is structured)
// @route   GET /api/practice-contests/:practiceContestId/leaderboard
const getLeaderboard = async (req, res) => {
  const { practiceContestId } = req.params;
  const userId = req.user.id;

  try {
    const contest = await PracticeContest.findById(practiceContestId).populate(
      "leaderboard.user",
      "codeforcesHandle name"
    ); // Populate user details in leaderboard

    if (!contest) {
      return res.status(404).json({ message: "Practice contest not found." });
    }

    if (contest.user.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this leaderboard." });
    }

    if (!contest.leaderboard || contest.leaderboard.length === 0) {
      const owner = await User.findById(contest.user).select(
        "codeforcesHandle name"
      );
      let solvedCount = 0;
      let totalPenalty = 0; // Implement penalty logic if needed
      contest.problems.forEach((p) => {
        if (p.solved) {
          solvedCount++;
          totalPenalty += p.userSolveTimeSeconds || 0; // Simple penalty: sum of solve times
        }
      });
      return res.json([
        {
          user: owner,
          score: solvedCount, // Score based on number of problems solved
          penalty: totalPenalty,
          rank: 1,
        },
      ]);
    }

    res.json(contest.leaderboard);
  } catch (error) {
    console.error(
      `Error fetching leaderboard for practice contest ${practiceContestId}:`,
      error.message
    );
    res
      .status(500)
      .json({ message: "Server error while fetching leaderboard." });
  }
};

// @desc    Get all practice contests for the authenticated user
// @route   GET /api/practice-contests/me
const getUserPracticeContests = async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10, status } = req.query;

  try {
    const query = { user: userId };
    if (status) {
      query.status = status.toUpperCase();
    }

    const contests = await PracticeContest.find(query)
      .populate("problems.problem", "problemId name rating") // Populate basic problem info
      .sort({ createdAt: -1 }) // Sort by most recently created
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await PracticeContest.countDocuments(query);

    res.json({
      contests,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalContests: count,
    });
  } catch (error) {
    console.error(
      `Error fetching practice contests for user ${userId}:`,
      error.message
    );
    res
      .status(500)
      .json({ message: "Server error while fetching user practice contests." });
  }
};

// @desc    Sync user's CF submissions with an ongoing practice contest
// @route   POST /api/practice-contests/:practiceContestId/sync
const syncPracticeContestSubmissions = async (req, res) => {
  const { practiceContestId } = req.params;
  const userId = req.user.id;

  try {
    const contest = await PracticeContest.findById(practiceContestId).populate(
      "problems.problem"
    );
    if (!contest) {
      return res.status(404).json({ message: "Practice contest not found." });
    }
    if (contest.status !== "ONGOING") {
      return res
        .status(400)
        .json({ message: "Can only sync submissions for an ONGOING contest." });
    }

    const user = await User.findById(userId);
    if (!user || !user.codeforcesHandle) {
      return res
        .status(404)
        .json({ message: "User or Codeforces handle not found." });
    }
    if (contest.user.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to sync this contest." });
    }

    // Call the service function to do the heavy lifting
    const syncResult =
      await codeforcesService.syncSubmissionsForPracticeContest(
        user.codeforcesHandle,
        contest
      );

    res.status(200).json({
      message: "Sync completed successfully.",
      data: syncResult, // e.g., { newSubmissionsCount: 5, updatedProblemsCount: 2 }
    });
  } catch (error) {
    console.error("Error syncing contest submissions:", error.message);
    res.status(500).json({ message: "Server error during sync." });
  }
};

module.exports = {
  generatePracticeContest,
  getPracticeContest,
  startPracticeContest,
  completePracticeContest,
  flagEditorialAccess,
  getLeaderboard,
  getUserPracticeContests,
  syncPracticeContestSubmissions,
};
