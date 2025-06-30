const User = require("../models/User");

const adminMiddleware = (req, res, next) => {
  try {
    // Check if user exists and has admin role
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin privileges required." });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res
      .status(500)
      .json({ message: "Internal server error in admin middleware." });
  }
};

module.exports = adminMiddleware;
