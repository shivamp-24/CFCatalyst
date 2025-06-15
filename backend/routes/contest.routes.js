const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const contestController = require("../controllers/contestController");
const adminMiddleware = require("../middlewares/adminMiddleware");
const codeforcesApiLimiter = require("../middlewares/codeforcesApiLimiter");
const contestRouter = express.Router();

contestRouter.get("/", authMiddleware, contestController.getContests);
contestRouter.get("/:contestId", authMiddleware, contestController.getContest);
contestRouter.post(
  "/sync",
  authMiddleware,
  adminMiddleware,
  codeforcesApiLimiter,
  contestController.syncContests
);

module.exports = contestRouter;
