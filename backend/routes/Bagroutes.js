const express = require("express");
const Bag = require("../models/Bag");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { userId, productId, size, quantity } = req.body;
    if (!userId || !productId || !size || !quantity) {
      return res.status(400).json({ message: "Missing required bag fields" });
    }

    let existingItem = await Bag.findOne({ userId, productId, size });
    if (existingItem) {
      existingItem.quantity = existingItem.quantity + quantity;
      const updatedItem = await existingItem.save();
      return res.status(200).json(updatedItem);
    }

    const bagItem = new Bag({ userId, productId, size, quantity });
    const savedItem = await bagItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.put("/:itemid", async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity == null) {
      return res.status(400).json({ message: "Quantity is required" });
    }

    const item = await Bag.findById(req.params.itemid);
    if (!item) {
      return res.status(404).json({ message: "Bag item not found" });
    }

    item.quantity = quantity;
    const updatedItem = await item.save();
    res.status(200).json(updatedItem);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error updating bag item" });
  }
});

router.get("/:userid", async (req, res) => {
  try {
    const bag = await Bag.find({ userId: req.params.userid }).populate(
      "productId"
    );
    res.status(200).json(bag);
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
