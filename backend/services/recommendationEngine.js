const Product = require("../models/Product");
const BrowsingHistory = require("../models/BrowsingHistory");
const Wishlist = require("../models/Wishlist");

const HISTORY_LIMIT = 50;
const TARGET_QUERY_MS = 200;
const RELATED_CATEGORY_TERMS = {
  shoes: ["shoe", "sneaker", "running", "trainer", "footwear"],
  clothing: ["shirt", "t-shirt", "jeans", "jacket", "dress", "wear"],
};

async function recordBrowsingHistory(userId, product) {
  if (!userId || !product) return;

  await BrowsingHistory.findOneAndUpdate(
    { userId, productId: product._id },
    {
      userId,
      productId: product._id,
      category: product.category || "general",
      viewedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const count = await BrowsingHistory.countDocuments({ userId });
  if (count > HISTORY_LIMIT) {
    const oldest = await BrowsingHistory.find({ userId })
      .sort({ viewedAt: 1 })
      .limit(count - HISTORY_LIMIT)
      .select("_id");
    await BrowsingHistory.deleteMany({ _id: { $in: oldest.map((o) => o._id) } });
  }
}

function productText(product) {
  return `${product.name || ""} ${product.brand || ""} ${product.category || ""}`.toLowerCase();
}

function productTerms(product) {
  const text = productText(product);
  const terms = new Set();
  for (const [term, aliases] of Object.entries(RELATED_CATEGORY_TERMS)) {
    if (aliases.some((alias) => text.includes(alias))) terms.add(term);
  }
  return terms;
}

function scoreProduct(product, context) {
  const productId = product._id.toString();
  let score = 0;

  score += (product.viewCount || 0) * 0.1;
  score += (product.purchaseCount || 0) * 0.5;
  if (context.categories.has(product.category)) score += 6;
  if (context.wishlistCategories.has(product.category)) score += 4;
  if (context.wishlistIds.has(productId)) score += 8;
  const terms = productTerms(product);
  for (const term of terms) {
    if (context.preferredTerms.has(term)) score += 7;
  }

  return score;
}

async function getRecommendations(userId, limit = 8) {
  const start = Date.now();
  const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 30);

  const [history, wishlistItems, popular] = await Promise.all([
    userId
      ? BrowsingHistory.find({ userId }).sort({ viewedAt: -1 }).limit(HISTORY_LIMIT).lean()
      : [],
    userId
      ? Wishlist.find({ userId }).populate("productId", "name brand category").select("productId").lean()
      : [],
    Product.find({ isActive: { $ne: false }, isDiscontinued: { $ne: true } })
      .sort({ viewCount: -1, purchaseCount: -1 })
      .limit(safeLimit * 3)
      .lean(),
  ]);

  const historyProductIds = history.map((h) => h.productId.toString());
  const categories = new Set(history.map((h) => h.category).filter(Boolean));
  const wishlistIds = new Set(
    wishlistItems.map((w) => w.productId?._id?.toString()).filter(Boolean)
  );
  const wishlistCategories = new Set(
    wishlistItems.map((w) => w.productId?.category).filter(Boolean)
  );
  const preferredTerms = new Set();
  [...history, ...wishlistItems.map((w) => w.productId).filter(Boolean)].forEach((item) => {
    const productLike = item.productId ? item : item;
    productTerms(productLike).forEach((term) => preferredTerms.add(term));
  });
  const preferredCategories = [...new Set([...categories, ...wishlistCategories])];
  const excludeIds = [...new Set([...historyProductIds])];

  let candidates = [];
  if (preferredCategories.length > 0 || preferredTerms.size > 0) {
    const termRegexes = [...preferredTerms].flatMap((term) =>
      RELATED_CATEGORY_TERMS[term].map((alias) => new RegExp(alias, "i"))
    );
    const similarityFilters = [];
    if (preferredCategories.length > 0) similarityFilters.push({ category: { $in: preferredCategories } });
    if (termRegexes.length > 0) {
      similarityFilters.push({ name: { $in: termRegexes } }, { category: { $in: termRegexes } });
    }
    candidates = await Product.find({
      isActive: { $ne: false },
      isDiscontinued: { $ne: true },
      ...(similarityFilters.length > 0 ? { $or: similarityFilters } : {}),
      _id: { $nin: excludeIds },
    })
      .sort({ purchaseCount: -1, viewCount: -1 })
      .limit(safeLimit * 4)
      .lean();
  }

  const existingIds = new Set([...excludeIds, ...candidates.map((p) => p._id.toString())]);
  const fallback = popular.filter((p) => !existingIds.has(p._id.toString()));
  const allCandidates = [...candidates, ...fallback];

  const context = { categories, wishlistCategories, wishlistIds, preferredTerms };
  const products = allCandidates
    .map((product) => ({ product, score: scoreProduct(product, context) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, safeLimit)
    .map((entry) => entry.product);

  const queryTimeMs = Date.now() - start;
  return {
    products,
    meta: {
      count: products.length,
      queryTimeMs,
      targetMs: TARGET_QUERY_MS,
      withinTarget: queryTimeMs <= TARGET_QUERY_MS,
      strategy: preferredCategories.length > 0 || preferredTerms.size > 0 ? "personalized-batched" : "cold-start-popularity",
      complexity: "O(h + w + c log c), with h<=50 and c bounded by limit",
    },
  };
}

module.exports = { getRecommendations, recordBrowsingHistory };
