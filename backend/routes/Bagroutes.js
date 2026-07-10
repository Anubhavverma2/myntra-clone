const express = require("express");
const mongoose = require("mongoose");
const Bag = require("../models/Bag");
const Product = require("../models/Product");
const router = express.Router();

const isObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const isUnavailable = (product) => !product || !product.isActive || product.isDiscontinued;

function productUnavailableMessage(product) {
  if (!product) return "This product is no longer available.";
  if (product.isDiscontinued || !product.isActive) return `${product.name || "This product"} is no longer available.`;
  return "This product is no longer available.";
}

async function getCartPayload(userId, section) {
  const filter = { userId };
  if (section) filter.section = section;

  const bag = await Bag.find(filter).populate("productId");
  const activeItems = bag.filter((item) => item.section === "active");
  const savedItems = bag.filter((item) => item.section === "saved");

  const priceChanges = activeItems.filter(
    (item) => item.productId && item.priceAtAdd !== item.productId.price
  );
  const unavailable = activeItems.filter((item) => isUnavailable(item.productId));
  const outOfStock = activeItems.filter(
    (item) => item.productId && item.productId.stock <= 0
  );

  const subtotal = activeItems.reduce((sum, item) => {
    if (isUnavailable(item.productId)) return sum;
    return sum + item.productId.price * item.quantity;
  }, 0);
  const totalItems = activeItems.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryCharges = subtotal > 0 ? 99 : 0;
  const discount = 0;

  return {
    active: activeItems,
    saved: savedItems,
    total: subtotal,
    summary: {
      totalItems,
      subtotal,
      discount,
      deliveryCharges,
      grandTotal: subtotal + deliveryCharges - discount,
    },
    priceChanges: priceChanges.map((item) => ({
      itemId: item._id,
      productName: item.productId.name,
      oldPrice: item.priceAtAdd,
      newPrice: item.productId.price,
    })),
    discontinued: unavailable.map((item) => ({
      itemId: item._id,
      productName: item.productId?.name || "Product",
      message: productUnavailableMessage(item.productId),
    })),
    outOfStock: outOfStock.map((item) => ({
      itemId: item._id,
      productName: item.productId.name,
      message: `${item.productId.name} is out of stock.`,
    })),
  };
}

router.post("/", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { userId, productId, size, quantity = 1, section = "active" } = req.body;
    const qty = Number(quantity);
    if (!userId || !productId || !size || !["active", "saved"].includes(section)) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Missing required bag fields" });
    }
    if (!isObjectId(userId) || !isObjectId(productId) || qty < 1) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Invalid bag request" });
    }

    const product = await Product.findById(productId).session(session);
    if (isUnavailable(product)) {
      await session.abortTransaction();
      return res.status(400).json({ message: productUnavailableMessage(product) });
    }

    const activeItem = await Bag.findOne({ userId, productId, size, section: "active" }).session(session);
    const savedItem = await Bag.findOne({ userId, productId, size, section: "saved" }).session(session);

    const targetExisting = section === "active" ? activeItem : savedItem;
    const oppositeExisting = section === "active" ? savedItem : activeItem;
    const mergedQuantity = (targetExisting?.quantity || 0) + (oppositeExisting?.quantity || 0) + qty;

    if (section === "active" && product.stock < mergedQuantity) {
      await session.abortTransaction();
      return res.status(400).json({ message: `Only ${product.stock} items available.` });
    }

    let itemToReturn;
    if (targetExisting) {
      targetExisting.quantity = mergedQuantity;
      targetExisting.version += 1;
      targetExisting.priceAtAdd = product.price;
      itemToReturn = await targetExisting.save({ session });
    } else if (oppositeExisting) {
      oppositeExisting.section = section;
      oppositeExisting.quantity = mergedQuantity;
      oppositeExisting.version += 1;
      oppositeExisting.priceAtAdd = product.price;
      itemToReturn = await oppositeExisting.save({ session });
    } else {
      itemToReturn = await Bag.create(
        [{ userId, productId, size, quantity: qty, section, priceAtAdd: product.price }],
        { session }
      ).then((items) => items[0]);
    }

    if (targetExisting && oppositeExisting) {
      await Bag.findByIdAndDelete(oppositeExisting._id, { session });
    }

    await session.commitTransaction();
    res.status(200).json(itemToReturn);
  } catch (error) {
    await session.abortTransaction();
    if (error.code === 11000) {
      return res.status(409).json({ message: "Cart changed on another device. Please refresh." });
    }
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  } finally {
    session.endSession();
  }
});

router.put("/:itemid", async (req, res) => updateBagQuantity(req, res));
router.patch("/:itemid", async (req, res) => updateBagQuantity(req, res));

async function updateBagQuantity(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { quantity, version } = req.body;
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const item = await Bag.findById(req.params.itemid).session(session);
    if (!item) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Bag item not found" });
    }

    if (version != null && item.version !== Number(version)) {
      await session.abortTransaction();
      return res.status(409).json({
        message: "Cart was updated on another device. Please refresh.",
        currentVersion: item.version,
      });
    }

    const product = await Product.findById(item.productId).session(session);
    if (isUnavailable(product)) {
      await session.abortTransaction();
      return res.status(400).json({ message: productUnavailableMessage(product) });
    }
    if (item.section === "active" && product.stock < qty) {
      await session.abortTransaction();
      return res.status(400).json({ message: `Only ${product.stock} items available.` });
    }

    item.quantity = qty;
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
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { section } = req.body;
    if (!["active", "saved"].includes(section)) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Invalid section" });
    }

    const item = await Bag.findById(req.params.itemid).session(session);
    if (!item) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Item not found" });
    }

    const product = await Product.findById(item.productId).session(session);
    if (section === "active") {
      if (isUnavailable(product)) {
        await session.abortTransaction();
        return res.status(400).json({ message: productUnavailableMessage(product) });
      }
    }

    const duplicate = await Bag.findOne({
      userId: item.userId,
      productId: item.productId,
      size: item.size,
      section,
      _id: { $ne: item._id },
    }).session(session);

    const nextQuantity = item.quantity + (duplicate?.quantity || 0);
    if (section === "active" && product.stock < nextQuantity) {
      await session.abortTransaction();
      return res.status(400).json({ message: `Only ${product.stock} items available.` });
    }

    let movedItem;
    if (duplicate) {
      duplicate.quantity = nextQuantity;
      duplicate.version += 1;
      duplicate.priceAtAdd = product?.price || duplicate.priceAtAdd;
      movedItem = await duplicate.save({ session });
      await Bag.findByIdAndDelete(item._id, { session });
    } else {
      item.section = section;
      item.version += 1;
      if (product) item.priceAtAdd = product.price;
      movedItem = await item.save({ session });
    }

    await session.commitTransaction();
    res.status(200).json(movedItem);
  } catch (error) {
    await session.abortTransaction();
    if (error.code === 11000) {
      return res.status(409).json({ message: "Cart changed on another device. Please refresh." });
    }
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  } finally {
    session.endSession();
  }
});

router.get("/:userid", async (req, res) => {
  try {
    if (!isObjectId(req.params.userid)) return res.status(400).json({ message: "Invalid userId" });
    const payload = await getCartPayload(req.params.userid, req.query.section);
    res.status(200).json(payload);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.post("/validate-checkout/:userid", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!isObjectId(req.params.userid)) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Invalid userId" });
    }

    const activeItems = await Bag.find({ userId: req.params.userid, section: "active" })
      .populate("productId")
      .session(session);

    const issues = [];
    for (const item of activeItems) {
      if (isUnavailable(item.productId)) {
        issues.push({
          itemId: item._id,
          type: "discontinued",
          message: productUnavailableMessage(item.productId),
        });
      } else if (item.productId.stock <= 0) {
        issues.push({
          itemId: item._id,
          type: "out_of_stock",
          message: `${item.productId.name} is out of stock.`,
        });
      } else if (item.productId.stock < item.quantity) {
        issues.push({
          itemId: item._id,
          type: "stock",
          message: `Only ${item.productId.stock} items available.`,
          availableStock: item.productId.stock,
        });
      } else if (item.priceAtAdd !== item.productId.price) {
        issues.push({
          itemId: item._id,
          type: "price_change",
          message: `${item.productId.name} price changed from ₹${item.priceAtAdd} to ₹${item.productId.price}.`,
          oldPrice: item.priceAtAdd,
          newPrice: item.productId.price,
        });
        item.priceAtAdd = item.productId.price;
        item.version += 1;
        await item.save({ session });
      }
    }

    await session.commitTransaction();
    res.status(200).json({ valid: issues.length === 0, issues });
  } catch (error) {
    await session.abortTransaction();
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  } finally {
    session.endSession();
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
