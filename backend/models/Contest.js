const mongoose = require("mongoose");

const contestSchema = new mongoose.Schema(
  {
    contestId: {
      type: Number,
      required: true,
      unique: true,
      index: true, // Good for lookups
    },
    name: {
      type: String,
      required: true,
      trim: true,
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
    frozen: {
      type: Boolean,
      default: false,
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
    relativeTimeSeconds: {
      type: Number,
    },
    preparedBy: {
      type: String,
      trim: true,
    },
    websiteUrl: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    difficulty: {
      type: Number, // From CF API: difficulty (1-5)
    },
    kind: {
      type: String,
      trim: true,
    },
    icpcRegion: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    season: {
      type: String,
      trim: true,
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
