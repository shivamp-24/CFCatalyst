const express = require("express");
const problemRouter = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const problemController = require("../controllers/problemController");

problemRouter.get("/", authMiddleware, problemController.getProblems);
problemRouter.get("/:problemId", authMiddleware, problemController.getProblem);

module.exports = problemRouter;
