const mongoose = require("mongoose");

const TransactionAuditSchema = new mongoose.Schema(
  {
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", required: true },
    event: {
      type: String,
      enum: ["created", "success", "failed", "refund", "webhook_received"],
      required: true,
    },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TransactionAudit", TransactionAuditSchema);
