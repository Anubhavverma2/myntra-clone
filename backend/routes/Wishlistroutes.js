const express = require("express");
const Wishlist = require("../models/Wishlist");
const Bag = require("../models/Bag");
const Product = require("../models/Product");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { userId, productId } = req.body;
    if (!userId || !productId) {
      return res.status(400).json({ message: "Missing required wishlist fields" });
    }

    const existingItem = await Wishlist.findOne({ userId, productId });
    if (existingItem) {
      return res.status(200).json({ item: existingItem, added: false });
    }

    const wishlistItem = new Wishlist({ userId, productId });
    const savedItem = await wishlistItem.save();
    res.status(201).json({ item: savedItem, added: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.post("/toggle", async (req, res) => {
  try {
    const { userId, productId } = req.body;
    if (!userId || !productId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await Wishlist.findOne({ userId, productId });
    if (existing) {
      await Wishlist.findByIdAndDelete(existing._id);
      return res.status(200).json({ inWishlist: false, message: "Removed from wishlist" });
    }

    const item = await Wishlist.create({ userId, productId });
    return res.status(201).json({ inWishlist: true, item });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/check/:userId/:productId", async (req, res) => {
  try {
    const item = await Wishlist.findOne({
      userId: req.params.userId,
      productId: req.params.productId,
    });
    res.status(200).json({ inWishlist: !!item, itemId: item?._id || null });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/:userid", async (req, res) => {
  try {
    const items = await Wishlist.find({ userId: req.params.userid }).populate("productId");
    res.status(200).json(items);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.post("/move-to-bag", async (req, res) => {
  try {
    const { userId, wishlistItemId, size, quantity = 1 } = req.body;
    if (!userId || !wishlistItemId || !size) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const wishlistItem = await Wishlist.findById(wishlistItemId).populate("productId");
    if (!wishlistItem) return res.status(404).json({ message: "Wishlist item not found" });

    const product = wishlistItem.productId;
    if (product.isActive === false || product.isDiscontinued === true) {
      return res.status(400).json({ message: "Product is discontinued" });
    }
    const availableStock = Number.isFinite(Number(product.stock)) ? Number(product.stock) : 100;
    if (availableStock < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    let bagItem = await Bag.findOne({
      userId,
      productId: product._id,
      size,
      section: "active",
    });

    if (bagItem) {
      bagItem.quantity += quantity;
      bagItem.version += 1;
      await bagItem.save();
    } else {
      bagItem = await Bag.create({
        userId,
        productId: product._id,
        size,
        quantity,
        section: "active",
        priceAtAdd: product.price,
      });
    }

    await Wishlist.findByIdAndDelete(wishlistItemId);
    res.status(200).json({ message: "Moved to bag", bagItem });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.delete("/:itemid", async (req, res) => {
  try {
    await Wishlist.findByIdAndDelete(req.params.itemid);
    res.status(200).json({ message: "Item removed from Wishlist" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error removing item from Wishlist" });
  }
});

module.exports = router;
