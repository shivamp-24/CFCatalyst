const rateLimit = require("express-rate-limit");

const codeforcesApiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Limit to 5 requests per windowMs
  message: {
    message:
      "Too many requests to Codeforces API dependent endpoint from this IP, please try again after 5 minutes.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = codeforcesApiLimiter;
