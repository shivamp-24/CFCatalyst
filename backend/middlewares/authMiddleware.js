const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  const { token } = req.headers;
  try {
    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;

    if (!req.user || !req.user.id) {
      console.error("Token decoded, but user.id missing in payload:", decoded);
      return res.status(401).json({
        message: "Token is valid, but payload structure is incorrect.",
      });
    }

    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Token is invalid." });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired." });
    }

    return res.status(401).json({ message: "Token is not valid." });
  }
};

module.exports = authMiddleware;
