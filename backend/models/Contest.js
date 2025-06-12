const mongoose = require("mongoose");

const contestSchema = new mongoose.Schema(
  {
    contestId: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["CF", "IOI", "ICPC", "Other"],
      required: true,
    },
    phase: {
      type: String,
      enum: [
        "BEFORE",
        "CODING",
        "PENDING_SYSTEM_TEST",
        "SYSTEM_TEST",
        "FINISHED",
      ],
      required: true,
    },
    startTimeSeconds: {
      // Unix timestamp for contest start
      type: Number,
      required: true,
    },
    durationSeconds: {
      // Duration of the contest in seconds
      type: Number,
      required: true,
    },
    problems: [
      // Array of references to Problem documents
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Problem",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contest", contestSchema);
