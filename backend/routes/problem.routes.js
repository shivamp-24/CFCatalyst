const express = require("express");
const problemRouter = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const problemController = require("../controllers/problemController");
const adminMiddleware = require("../middlewares/adminMiddleware");
const codeforcesApiLimiter = require("../middlewares/codeforcesApiLimiter");

problemRouter.get("/", authMiddleware, problemController.getProblems);
problemRouter.get("/:problemId", authMiddleware, problemController.getProblem);
problemRouter.post(
  "/sync",
  authMiddleware,
  adminMiddleware,
  codeforcesApiLimiter,
  problemController.syncProblems
);

module.exports = problemRouter;
