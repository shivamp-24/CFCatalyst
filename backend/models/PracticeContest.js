const mongoose = require("mongoose");

const practiceContestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    problems: [
      {
        problem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Problem",
          required: true,
        },
        userSolveTimeSeconds: {
          // Time from practice contest start to solve this problem
          type: Number,
          default: null,
        },
        solved: {
          type: Boolean,
          default: false,
        },
        editorialAccessed: {
          type: Boolean,
          default: false,
        },
      },
    ],
    durationMinutes: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "ONGOING", "COMPLETED", "ABANDONED"],
      default: "PENDING",
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    userPerformanceRating: {
      type: Number,
      default: null,
    },
    userRatingChange: {
      type: Number,
      default: 0,
    },
    leaderboard: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        score: {
          type: Number,
        },
        penalty: {
          type: Number,
        },
        rank: {
          type: Number,
        },
      },
    ],
    contestTypeParams: {
      // Parameters used to generate this contest
      type: Object, // Store things like rating range, tags, problem count etc.
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PracticeContest", practiceContestSchema);
