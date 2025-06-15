const Contest = require("../models/Contest");
const codeforcesService = require("../services/codeforcesService");

// @desc    Get contests from local DB with filtering and pagination
// @route   GET /api/contests
const getContests = async (req, res) => {
  const {
    phase,
    type,
    page = 1,
    limit = 20,
    sortBy = "startTimeSeconds",
    order = "desc",
  } = req.query;

  try {
    const query = {};
    if (phase) {
      query.phase = phase.toUpperCase();
    }

    if (type) {
      query.type = type.toUpperCase();
    }

    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = order === "asc" ? 1 : -1;
    } else {
      sortOptions["startTimeSeconds"] = -1;
    }

    const contests = await Contest.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortOptions)
      .populate("problems");

    const count = await Contest.countDocuments(query);

    res.json({
      contests,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalContests: count,
    });
  } catch (error) {
    console.error("Error fetching contests:", error.message);
    res.status(500).json({ message: "Server error while fetching contests." });
  }
};

// @desc    Get a specific contest by its Codeforces contestId
// @route   GET /api/contests/:contestId
const getContest = async (req, res) => {
  const contestId = req.params.contestId;

  try {
    if (isNaN(contestId)) {
      return res
        .status(400)
        .json({ message: "Invalid contest ID format. Must be a number." });
    }

    const contest = await Contest.findOne({ contestId }).populate("problems");

    if (!contest) {
      return res
        .status(404)
        .json({ message: "Contest not found in local database." });
    }

    res.json(contest);
  } catch (error) {
    console.error(
      `Error fetching contest ${req.params.contestId}:`,
      error.message
    );
    res.status(500).json({ message: "Server error while fetching contest." });
  }
};

// @desc    Sync contests from Codeforces API to local DB
// @route   POST /api/contests/sync
const syncContests = async (req, res) => {
  try {
    console.log("Contest sync initiated by admin:", req.user.id);

    const { newContestsCount, updatedContestsCount, totalContestsProcessed } =
      await codeforcesService.syncContests();

    res.json({
      message: "Contests synchronization complete.",
      newContestsAdded: newContestsCount,
      existingContestsUpdated: updatedContestsCount,
      totalContestsFetchedFromCF: totalContestsProcessed,
    });
  } catch (error) {
    console.error(
      "Error during contests synchronization:",
      error.message,
      error.stack
    );
    if (error.message && error.message.includes("Codeforces API error")) {
      return res.status(502).json({ message: error.message }); // Propagate CF API error message
    }
    res
      .status(500)
      .json({ message: "Server error during contests synchronization." });
  }
};

module.exports = { getContests, getContest, syncContests };
