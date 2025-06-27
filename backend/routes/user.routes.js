const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

userRouter.get("/profile/:codeforcesHandle", userController.getProfile);
userRouter.put("/profile", authMiddleware, userController.updateProfile);
userRouter.get("/me/cf-stats", authMiddleware, userController.getCFStats);
userRouter.get(
  "/me/practice-history",
  authMiddleware,
  userController.getPracticeHistory
);
userRouter.get(
  "/me/dashboard-stats",
  authMiddleware,
  userController.getDashboardStats
);
userRouter.post(
  "/me/dashboard-stats/update",
  authMiddleware,
  userController.updateDashboardStats
);
userRouter.get(
  "/me/recent-contests",
  authMiddleware,
  userController.getRecentContests
);
userRouter.get("/me/weak-topics", authMiddleware, userController.getWeakTopics);

module.exports = userRouter;
