const User = require("../models/User");

const adminMiddleware = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res
      .status(401)
      .json({ message: "Authentication required. No user identified." });
  }

  try {
    const user = await User.findById(req.user.id).select("role");

    if (!user) {
      return res
        .status(401)
        .json({ message: "User not found, authorization denied." });
    }

    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin privileges required." });
    }
    next();
  } catch (error) {
    console.error("Error in admin middleware:", error.message);
    res
      .status(500)
      .json({ message: "Server error during admin authorization." });
  }
};

module.exports = adminMiddleware;
