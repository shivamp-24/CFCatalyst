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

module.exports = userRouter;
