const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    submissionCfId: {
      type: Number,
      index: true,
      unique: true,
      sparse: true,
    },
    practiceContest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PracticeContest",
      required: true,
      index: true, // Good for querying submissions by practice contest
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Good for querying submissions by practice user
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
      index: true, // Good for querying submissions by practice problem
    },
    code: {
      type: String,
    },
    language: {
      type: String,
    },
    verdict: {
      type: String,
      // enum: [
      //   "ACCEPTED",
      //   "SOLVED_LOCALLY",
      //   "WRONG_ANSWER",
      //   "TIME_LIMIT_EXCEEDED",
      //   "EDITORIAL USED",
      //   "OTHER",
      // ],
    },
    solveTimeSeconds: {
      type: Number,
      default: null,
    },
    editorialAccessBeforeSubmit: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true } // Adds createdAt (for submission time) and updatedAt
);

module.exports = mongoose.model("Submission", submissionSchema);
