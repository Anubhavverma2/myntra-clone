const mongoose = require("mongoose");

const BrowsingHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    category: String,
    viewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

BrowsingHistorySchema.index({ userId: 1, productId: 1 }, { unique: true });
BrowsingHistorySchema.index({ userId: 1, viewedAt: -1 });
BrowsingHistorySchema.index({ viewedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model("BrowsingHistory", BrowsingHistorySchema);
