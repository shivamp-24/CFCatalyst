const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const contestController = require("../controllers/contestController");
const contestRouter = express.Router();

contestRouter.get("/", authMiddleware, contestController.getContests);
contestRouter.get("/:contestId", authMiddleware, contestController.getContest);

module.exports = contestRouter;
