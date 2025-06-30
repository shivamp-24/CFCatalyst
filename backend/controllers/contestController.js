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

module.exports = { getContests, getContest };
