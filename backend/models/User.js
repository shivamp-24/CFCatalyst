const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
    },
    country: {
      type: String,
    },
    codeforcesHandle: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    codeforcesRating: {
      type: Number,
      default: 0,
    },
    maxRating: {
      type: Number,
      default: 0,
    },
    avatar: {
      type: String,
    },
    titlePhoto: {
      type: String,
    },
    solvedProblems: [
      {
        type: String, // e.g., "1700A", "1650B"
      },
    ],
    practiceContestHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PracticeContest",
      },
    ],
    // Cached Codeforces contest history
    cfContestHistory: {
      contests: [
        {
          type: Object, // Store the entire contest object as-is
        },
      ],
      lastUpdated: { type: Date, default: null },
    },
    // Dashboard statistics
    dashboardStats: {
      // Problems solved statistics
      problemsSolved: {
        currentMonth: {
          count: { type: Number, default: 0 },
          lastUpdated: { type: Date, default: Date.now },
        },
        previousMonth: {
          count: { type: Number, default: 0 },
          lastUpdated: { type: Date, default: Date.now },
        },
      },
      // Rating statistics
      rating: {
        currentMonth: {
          value: { type: Number, default: 0 },
          lastUpdated: { type: Date, default: Date.now },
        },
        previousMonth: {
          value: { type: Number, default: 0 },
          lastUpdated: { type: Date, default: Date.now },
        },
      },
      // Practice contests statistics
      practiceContests: {
        currentMonth: {
          count: { type: Number, default: 0 },
          lastUpdated: { type: Date, default: Date.now },
        },
        previousMonth: {
          count: { type: Number, default: 0 },
          lastUpdated: { type: Date, default: Date.now },
        },
      },
      // Performance statistics
      performance: {
        currentMonth: {
          value: { type: Number, default: 0 }, // Percentage value
          lastUpdated: { type: Date, default: Date.now },
        },
        previousMonth: {
          value: { type: Number, default: 0 }, // Percentage value
          lastUpdated: { type: Date, default: Date.now },
        },
      },
      lastFullUpdate: { type: Date, default: null },
    },
    // Weak topics data
    weakTopics: {
      topics: [
        {
          name: String,
          successRate: Number,
          total: Number,
          accepted: Number,
          rejected: Number,
        },
      ],
      lastUpdated: { type: Date, default: null },
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt
);

module.exports = mongoose.model("User", userSchema);
