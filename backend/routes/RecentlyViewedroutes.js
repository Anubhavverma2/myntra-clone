const express = require("express");
const RecentlyViewed = require("../models/RecentlyViewed");
const Product = require("../models/Product");
const { recordBrowsingHistory } = require("../services/recommendationEngine");
const router = express.Router();

const MAX_ITEMS = 20;

async function upsertView(userId, productId) {
  await RecentlyViewed.findOneAndUpdate(
    { userId, productId },
    { viewedAt: new Date() },
    { upsert: true, new: true }
  );

  const count = await RecentlyViewed.countDocuments({ userId });
  if (count > MAX_ITEMS) {
    const excess = await RecentlyViewed.find({ userId })
      .sort({ viewedAt: 1 })
      .limit(count - MAX_ITEMS)
      .select("_id");
    await RecentlyViewed.deleteMany({ _id: { $in: excess.map((e) => e._id) } });
  }
}

router.post("/", async (req, res) => {
  try {
    const { userId, productId } = req.body;
    if (!userId || !productId) {
      return res.status(400).json({ message: "userId and productId required" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    await upsertView(userId, productId);
    await recordBrowsingHistory(userId, product);
    product.viewCount = (product.viewCount || 0) + 1;
    await product.save();

    const items = await RecentlyViewed.find({ userId })
      .sort({ viewedAt: -1 })
      .populate("productId");

    res.status(200).json(items);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const items = await RecentlyViewed.find({ userId: req.params.userId })
      .sort({ viewedAt: -1 })
      .populate("productId");
    res.status(200).json(items);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.post("/merge", async (req, res) => {
  try {
    const { userId, localItems = [] } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required" });

    for (const item of localItems) {
      if (!item.productId) continue;
      await upsertView(userId, item.productId);
    }

    const serverItems = await RecentlyViewed.find({ userId }).lean();
    const mergedMap = new Map();

    for (const item of localItems) {
      if (!item.productId) continue;
      mergedMap.set(item.productId, new Date(item.viewedAt || Date.now()));
    }
    for (const item of serverItems) {
      const key = item.productId.toString();
      const existing = mergedMap.get(key);
      const serverDate = new Date(item.viewedAt);
      if (!existing || serverDate > existing) {
        mergedMap.set(key, serverDate);
      }
    }

    const sorted = [...mergedMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_ITEMS);

    await RecentlyViewed.deleteMany({ userId });
    if (sorted.length > 0) {
      await RecentlyViewed.insertMany(
        sorted.map(([productId, viewedAt]) => ({ userId, productId, viewedAt }))
      );
    }

    const items = await RecentlyViewed.find({ userId })
      .sort({ viewedAt: -1 })
      .populate("productId");

    res.status(200).json(items);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
