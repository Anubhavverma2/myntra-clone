const express = require("express");
const mongoose = require("mongoose");
const RecentlyViewed = require("../models/RecentlyViewed");
const Product = require("../models/Product");
const { recordBrowsingHistory } = require("../services/recommendationEngine");
const router = express.Router();

const MAX_ITEMS = 20;

const isObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

async function trimRecentlyViewed(userId) {
  const count = await RecentlyViewed.countDocuments({ userId });
  if (count > MAX_ITEMS) {
    const excess = await RecentlyViewed.find({ userId })
      .sort({ viewedAt: 1 })
      .limit(count - MAX_ITEMS)
      .select("_id");
    await RecentlyViewed.deleteMany({ _id: { $in: excess.map((e) => e._id) } });
  }
}

async function upsertView(userId, productId, viewedAt = new Date()) {
  await RecentlyViewed.findOneAndUpdate(
    { userId, productId },
    {
      $setOnInsert: { userId, productId },
      $max: { viewedAt: new Date(viewedAt) },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await trimRecentlyViewed(userId);
}

async function bulkMergeViews(userId, localItems) {
  const latestByProduct = new Map();

  for (const item of localItems) {
    if (!isObjectId(item?.productId)) continue;
    const viewedAt = new Date(item.viewedAt || Date.now());
    if (Number.isNaN(viewedAt.getTime())) continue;

    const key = item.productId.toString();
    const existing = latestByProduct.get(key);
    if (!existing || viewedAt > existing) {
      latestByProduct.set(key, viewedAt);
    }
  }

  if (latestByProduct.size > 0) {
    await RecentlyViewed.bulkWrite(
      [...latestByProduct.entries()].map(([productId, viewedAt]) => ({
        updateOne: {
          filter: { userId, productId },
          update: {
            $setOnInsert: { userId, productId },
            $max: { viewedAt },
          },
          upsert: true,
        },
      })),
      { ordered: false }
    );
  }

  await trimRecentlyViewed(userId);
}

router.post("/", async (req, res) => {
  try {
    const { userId, productId } = req.body;
    if (!userId || !productId) {
      return res.status(400).json({ message: "userId and productId required" });
    }
    if (!isObjectId(userId) || !isObjectId(productId)) {
      return res.status(400).json({ message: "Invalid userId or productId" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    await upsertView(userId, productId);
    await recordBrowsingHistory(userId, product);
    await Product.updateOne({ _id: productId }, { $inc: { viewCount: 1 } });

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
    if (!isObjectId(req.params.userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const items = await RecentlyViewed.find({ userId: req.params.userId })
      .limit(MAX_ITEMS)
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
    if (!isObjectId(userId)) return res.status(400).json({ message: "Invalid userId" });
    if (!Array.isArray(localItems)) {
      return res.status(400).json({ message: "localItems must be an array" });
    }

    await bulkMergeViews(userId, localItems);

    const items = await RecentlyViewed.find({ userId })
      .sort({ viewedAt: -1 })
      .limit(MAX_ITEMS)
      .populate("productId");

    res.status(200).json(items);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
