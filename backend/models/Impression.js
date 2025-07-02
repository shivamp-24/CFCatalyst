const mongoose = require("mongoose");

const impressionSchema = new mongoose.Schema(
  {
    page: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    userAgent: {
      type: String,
    },
    ip: {
      type: String,
    },
    referrer: {
      type: String,
    },
    isUnique: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for faster queries on common filters
impressionSchema.index({ timestamp: -1 });
impressionSchema.index({ page: 1, timestamp: -1 });
impressionSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model("Impression", impressionSchema);
