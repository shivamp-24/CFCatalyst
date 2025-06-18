const express = require("express");
const practiceContestRouter = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const practiceContestController = require("../controllers/practiceContestController");

practiceContestRouter.post(
  "/generate",
  authMiddleware,
  practiceContestController.generatePracticeContest
);
practiceContestRouter.get(
  "/:practiceContestId",
  authMiddleware,
  practiceContestController.getPracticeContest
);
practiceContestRouter.post(
  "/:practiceContestId/start",
  authMiddleware,
  practiceContestController.startPracticeContest
);
practiceContestRouter.post(
  "/:practiceContestId/complete",
  authMiddleware,
  practiceContestController.completePracticeContest
);
practiceContestRouter.put(
  "/:practiceContestId/problems/:problemObjectId/editorial",
  authMiddleware,
  practiceContestController.flagEditorialAccess
);
practiceContestRouter.get(
  "/:practiceContestId/leaderboard",
  authMiddleware,
  practiceContestController.getLeaderboard
);
practiceContestRouter.get(
  "/me",
  authMiddleware,
  practiceContestController.getUserPracticeContests
);
practiceContestRouter.post(
  "/:practiceContestId/sync",
  authMiddleware,
  practiceContestController.syncPracticeContestSubmissions
);

module.exports = practiceContestRouter;
