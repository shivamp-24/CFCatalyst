const Problem = require("../models/Problem");
const codeforcesService = require("../services/codeforcesService");

// @desc    Get problems from local DB with filtering and pagination
// @route   GET /api/problems
const getProblems = async (req, res) => {
  const {
    tags,
    minRating,
    maxRating,
    contestId,
    page = 1,
    limit = 20,
  } = req.query;

  try {
    const query = {};
    if (tags) {
      query.tags = { $in: tags.split(",").map((tag) => tag.trim()) };
    }

    if (minRating) {
      query.rating = { ...query.rating, $gte: parseInt(minRating) };
    }

    if (maxRating) {
      query.rating = { ...query.rating, $lte: parseInt(maxRating) };
    }

    if (contestId) {
      query.contestId = parseInt(contestId);
    }

    const problems = await Problem.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ contestId: -1, index: 1 });

    const count = await Problem.countDocuments(query);

    res.json({
      problems,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalProblems: count,
    });
  } catch (error) {
    console.error("Error fetching problems:", error.message);
    res.status(500).json({ message: "Server error while fetching problems." });
  }
};

// @desc    Get a specific problem by its problemId
// @route   GET /api/problems/:problemId (e.g., /api/problems/1800C1)
const getProblem = async (req, res) => {
  const problemId = req.params.problemId;

  try {
    const problem = await Problem.findOne({ problemId });

    if (!problem) {
      return res
        .status(404)
        .json({ message: "Problem not found in local database." });
    }
    res.json(problem);
  } catch (error) {
    console.error(
      `Error fetching problem ${req.params.problemId}:`,
      error.message
    );
    res.status(500).json({ message: "Server error while fetching problem." });
  }
};

module.exports = { getProblems, getProblem };
