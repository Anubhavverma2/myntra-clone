const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    invoiceId: { type: String, unique: true, required: true },
    paymentMode: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },
    webhookId: { type: String, sparse: true, unique: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ userId: 1, status: 1, createdAt: -1 });
TransactionSchema.index({ userId: 1, paymentMode: 1, createdAt: -1 });
TransactionSchema.index({ webhookId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Transaction", TransactionSchema);
