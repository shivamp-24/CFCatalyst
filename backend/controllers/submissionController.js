const Submission = require("../models/Submission");

// @desc    Get all submissions for a specific practice contest by the user
// @route   GET /api/submissions/practice-contest/:practiceContestId
const getSubmissionsByContest = async (req, res) => {
  const userId = req.user.id;
  const { practiceContestId } = req.params;

  try {
    const submissions = await Submission.find({
      practiceContest: practiceContestId,
      user: userId,
    })
      .sort({ createdAt: -1 }) // Show most recent first
      .populate("problem", "problemId name rating index");

    res.status(200).json({
      message: "Submissions fetched successfully.",
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    console.error("Error fetching submissions by contest:", error.message);
    res
      .status(500)
      .json({ message: "Server error while fetching submissions." });
  }
};

// @desc    Get all submissions for a specific problem within a practice contest by the user
// @route   GET /api/submissions/problem/:problemId/practice-contest/:practiceContestId
const getSubmissionsByProblem = async (req, res) => {
  const { problemId, practiceContestId } = req.params;
  const userId = req.params.id;

  try {
    const submissions = await Submission.find({
      practiceContest: practiceContestId,
      problem: problemId,
      user: userId,
    }).sort({ createdAt: -1 }); // Show most recent first;

    res.status(200).json({
      message: "Submissions for the problem fetched successfully.",
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    console.error("Error fetching submissions by problem:", error.message);
    res
      .status(500)
      .json({ message: "Server error while fetching submissions." });
  }
};

module.exports = { getSubmissionsByContest, getSubmissionsByProblem };
