const express = require("express");
const submissionRouter = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const submissionController = require("../controllers/submissionController");

submissionRouter.get(
  "/practice-contest/:practiceContestId",
  authMiddleware,
  submissionController.getSubmissionsByContest
);
submissionRouter.get(
  "/problem/:problemId/practice-contest/:practiceContestId",
  authMiddleware,
  submissionController.getSubmissionsByProblem
);

module.exports = submissionRouter;
