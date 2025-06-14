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
  },
  { timestamps: true } // Adds createdAt and updatedAt
);

module.exports = mongoose.model("User", userSchema);
