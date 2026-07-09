const mongoose = require("mongoose");

const NotificationJobSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    type: { type: String, enum: ["realtime", "scheduled"], default: "realtime" },
    scheduledAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["pending", "processing", "sent", "failed", "cancelled"],
      default: "pending",
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    sentAt: Date,
    lastError: String,
  },
  { timestamps: true }
);

NotificationJobSchema.index({ status: 1, scheduledAt: 1 });

module.exports = mongoose.model("NotificationJob", NotificationJobSchema);
