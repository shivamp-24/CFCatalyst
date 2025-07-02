const express = require("express");
const router = express.Router();
const { recordImpression } = require("../controllers/adminController");

// Impression route - no authentication required
router.post("/", recordImpression);

module.exports = router;
