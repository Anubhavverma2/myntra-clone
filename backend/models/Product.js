const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: String,
    brand: String,
    price: Number,
    discount: String,
    description: String,
    sizes: [String],
    images: [String],
    category: String,
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    stock: { type: Number, default: 100 },
    viewCount: { type: Number, default: 0 },
    purchaseCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ category: 1, brand: 1 });
ProductSchema.index({ viewCount: -1, purchaseCount: -1 });

module.exports = mongoose.model("Product", ProductSchema);
