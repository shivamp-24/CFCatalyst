const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const {
  getAdminStats,
  syncProblems,
  syncContests,
  getSyncStatus,
} = require("../controllers/adminController");

// All routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

// Admin routes
router.get("/stats", getAdminStats);
router.post("/sync/problems", syncProblems);
router.post("/sync/contests", syncContests);
router.get("/sync/status", getSyncStatus);

module.exports = router;
