const express = require("express");
const mongoose = require("mongoose");
const Bag = require("../models/Bag");
const Product = require("../models/Product");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { userId, productId, size, quantity = 1, section = "active" } = req.body;
    if (!userId || !productId || !size) {
      return res.status(400).json({ message: "Missing required bag fields" });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(400).json({ message: "Product unavailable or discontinued" });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    const updatedItem = await Bag.findOneAndUpdate(
      { userId, productId, size, section },
      {
        $inc: { quantity, version: 1 },
        $set: { priceAtAdd: product.price },
        $setOnInsert: { userId, productId, size, section },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json(updatedItem);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.put("/:itemid", async (req, res) => {
  return updateBagQuantity(req, res);
});

router.patch("/:itemid", async (req, res) => {
  return updateBagQuantity(req, res);
});

async function updateBagQuantity(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { quantity, version } = req.body;
    if (quantity == null) {
      return res.status(400).json({ message: "Quantity is required" });
    }

    const item = await Bag.findById(req.params.itemid).session(session);
    if (!item) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Bag item not found" });
    }

    if (version != null && item.version !== version) {
      await session.abortTransaction();
      return res.status(409).json({
        message: "Cart was updated on another device. Please refresh.",
        currentVersion: item.version,
      });
    }

    const product = await Product.findById(item.productId).session(session);
    if (!product || !product.isActive) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Product discontinued" });
    }
    if (product.stock < quantity) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Insufficient stock" });
    }

    item.quantity = quantity;
    item.version += 1;
    item.priceAtAdd = product.price;
    const updatedItem = await item.save({ session });
    await session.commitTransaction();
    res.status(200).json(updatedItem);
  } catch (error) {
    await session.abortTransaction();
    console.log(error);
    return res.status(500).json({ message: "Error updating bag item" });
  } finally {
    session.endSession();
  }
}

router.patch("/:itemid/move", async (req, res) => {
  try {
    const { section } = req.body;
    if (!["active", "saved"].includes(section)) {
      return res.status(400).json({ message: "Invalid section" });
    }

    const item = await Bag.findById(req.params.itemid);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const duplicate = await Bag.findOne({
      userId: item.userId,
      productId: item.productId,
      size: item.size,
      section,
      _id: { $ne: item._id },
    });

    if (duplicate) {
      duplicate.quantity += item.quantity;
      duplicate.version += 1;
      await duplicate.save();
      await Bag.findByIdAndDelete(item._id);
      return res.status(200).json(duplicate);
    }

    item.section = section;
    item.version += 1;
    await item.save();
    res.status(200).json(item);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/:userid", async (req, res) => {
  try {
    const section = req.query.section;
    const filter = { userId: req.params.userid };
    if (section) filter.section = section;

    const bag = await Bag.find(filter).populate("productId");
    const activeItems = bag.filter((b) => b.section === "active");
    const savedItems = bag.filter((b) => b.section === "saved");

    const priceChanges = activeItems.filter(
      (item) => item.productId && item.priceAtAdd !== item.productId.price
    );

    const total = activeItems.reduce((sum, item) => {
      if (!item.productId?.isActive) return sum;
      return sum + item.productId.price * item.quantity;
    }, 0);

    res.status(200).json({
      active: activeItems,
      saved: savedItems,
      total,
      priceChanges: priceChanges.map((i) => ({
        itemId: i._id,
        oldPrice: i.priceAtAdd,
        newPrice: i.productId.price,
      })),
      discontinued: activeItems.filter((i) => !i.productId?.isActive),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.post("/validate-checkout/:userid", async (req, res) => {
  try {
    const activeItems = await Bag.find({ userId: req.params.userid, section: "active" }).populate(
      "productId"
    );

    const issues = [];
    for (const item of activeItems) {
      if (!item.productId?.isActive) {
        issues.push({ itemId: item._id, type: "discontinued", message: "Product discontinued" });
      } else if (item.productId.stock < item.quantity) {
        issues.push({ itemId: item._id, type: "stock", message: "Insufficient stock" });
      } else if (item.priceAtAdd !== item.productId.price) {
        issues.push({
          itemId: item._id,
          type: "price_change",
          oldPrice: item.priceAtAdd,
          newPrice: item.productId.price,
        });
      }
    }

    res.status(200).json({ valid: issues.length === 0, issues });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.delete("/:itemid", async (req, res) => {
  try {
    await Bag.findByIdAndDelete(req.params.itemid);
    res.status(200).json({ message: "Item removed from bag" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error removing item from bag" });
  }
});

module.exports = router;
