const PracticeContest = require("../models/PracticeContest");
const User = require("../models/User");
const problemSelection = require("../utils/problemSelection");
const ratingCalculation = require("../utils/ratingCalculation");

// @desc    Generate a new practice contest
// @route   POST /api/practice-contests/generate
const generatePracticeContest = async (req, res) => {
  const {
    contestType,
    minRating,
    maxRating,
    tags,
    problemCount = 5,
    durationMinutes = 120, // Default duration
  } = req.body;

  try {
    // Validate input
    if (
      !contestType ||
      !minRating ||
      !maxRating ||
      problemCount < 1 ||
      problemCount > 10
    ) {
      return res.status(400).json({ message: "Invalid contest parameters" });
    }
    if (minRating > maxRating) {
      return res
        .status(400)
        .json({ message: "minRating cannot exceed maxRating" });
    }

    //check if user exists and then, populate practiceContestHistory
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found!" });

    //fetch the problems from logic in problemSelection
    const problems = await problemSelection.selectProblems(
      user.codeforcesHandle,
      contestType,
      Number(minRating),
      Number(maxRating),
      tags,
      Number(problemCount)
    );

    const practiceContest = new PracticeContest({
      user: req.user.id,
      problems: problems.map((p) => ({
        problem: p._id,
      })),
      durationMinutes: parseInt(durationMinutes),
      status: "PENDING",
      contestTypeParams: {
        contestType,
        minRating,
        maxRating,
        tags,
        problemCount,
      },
    });

    await practiceContest.save();

    //update user's practiceContestHistory
    user.practiceContestHistory.push(practiceContest._id);
    await user.save();

    // Populate problem details for the response
    const populatedContest = await PracticeContest.findById(practiceContest._id)
      .populate("user", "codeforcesHandle name")
      .populate(
        "problems.problem",
        "problemId name rating tags contestId index"
      );

    res
      .status(201)
      .json({ message: "Practice contest generated", data: populatedContest });
  } catch (error) {
    console.error("Error generating practice contest:", error.message);
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

module.exports = {
  generatePracticeContest,
  getPracticeContest,
  startPracticeContest,
  completePracticeContest,
  flagEditorialAccess,
  getLeaderboard,
  getUserPracticeContests,
};
