const Product = require("../models/Product");
const BrowsingHistory = require("../models/BrowsingHistory");
const Wishlist = require("../models/Wishlist");

async function recordBrowsingHistory(userId, product) {
  if (!userId || !product) return;

  await BrowsingHistory.findOneAndUpdate(
    { userId, productId: product._id },
    { category: product.category || "general", viewedAt: new Date() },
    { upsert: true, new: true }
  );

  const count = await BrowsingHistory.countDocuments({ userId });
  if (count > 50) {
    const oldest = await BrowsingHistory.find({ userId })
      .sort({ viewedAt: 1 })
      .limit(count - 50)
      .select("_id");
    await BrowsingHistory.deleteMany({ _id: { $in: oldest.map((o) => o._id) } });
  }
}

async function getRecommendations(userId, limit = 8) {
  const start = Date.now();

  const [history, wishlistItems, popular] = await Promise.all([
    userId
      ? BrowsingHistory.find({ userId }).sort({ viewedAt: -1 }).limit(10).lean()
      : [],
    userId ? Wishlist.find({ userId }).select("productId").lean() : [],
    Product.find({ isActive: true }).sort({ viewCount: -1, purchaseCount: -1 }).limit(limit).lean(),
  ]);

  const wishlistIds = new Set(wishlistItems.map((w) => w.productId.toString()));
  const historyProductIds = history.map((h) => h.productId.toString());
  const categories = [...new Set(history.map((h) => h.category).filter(Boolean))];

  let candidates = [];

  if (categories.length > 0) {
    candidates = await Product.find({
      isActive: true,
      category: { $in: categories },
      _id: { $nin: historyProductIds },
    })
      .sort({ purchaseCount: -1, viewCount: -1 })
      .limit(limit * 2)
      .lean();
  }

  if (candidates.length < limit) {
    const existingIds = new Set([
      ...historyProductIds,
      ...candidates.map((c) => c._id.toString()),
    ]);
    const fallback = popular.filter((p) => !existingIds.has(p._id.toString()));
    candidates = [...candidates, ...fallback];
  }

  const scored = candidates.map((product) => {
    let score = product.viewCount * 0.1 + product.purchaseCount * 0.5;
    if (wishlistIds.has(product._id.toString())) score += 10;
    if (categories.includes(product.category)) score += 5;
    return { product, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const results = scored.slice(0, limit).map((s) => s.product);

  return {
    products: results,
    meta: {
      count: results.length,
      queryTimeMs: Date.now() - start,
      strategy: categories.length > 0 ? "personalized" : "cold-start-popularity",
    },
  };
}

module.exports = { getRecommendations, recordBrowsingHistory };
