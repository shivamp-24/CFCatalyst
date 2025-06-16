const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema(
  {
    problemId: {
      // e.g., "1700A" (contestId + index) or a globally unique ID from API
      type: String,
      required: true,
      unique: true, // Important for preventing duplicate problems
      index: true,
    },
    contestId: {
      type: Number,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
    },
    index: {
      // e.g., "A", "B1", "C"
      type: String,
      required: true,
    },
    rating: {
      type: Number, // Can be null if not rated
    },
    tags: [
      {
        type: String,
      },
    ],
    type: {
      type: String,
      default: "PROGRAMMING",
    },
    points: {
      type: Number, // Can be null
    },
    solvedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Problem", problemSchema);
