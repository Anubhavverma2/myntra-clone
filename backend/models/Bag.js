const mongoose = require("mongoose");

const BagItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    size: { type: String, required: true },
    quantity: { type: Number, default: 1, min: 1 },
    section: { type: String, enum: ["active", "saved"], default: "active" },
    priceAtAdd: { type: Number, default: 0 },
    version: { type: Number, default: 0 },
  },
  { timestamps: true }
);

BagItemSchema.index({ userId: 1, productId: 1, size: 1, section: 1 }, { unique: true });

module.exports = mongoose.model("Bag", BagItemSchema);
