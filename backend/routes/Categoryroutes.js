const express = require("express");
const Category = require("../models/Category");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().populate("productId");
    res.status(200).json(categories);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, image, subcategory } = req.body;
    if (!name || !image) {
      return res.status(400).json({ message: "Name and image are required" });
    }

    const category = new Category({
      name,
      image,
      subcategory: Array.isArray(subcategory)
        ? subcategory
        : subcategory
        ? subcategory.split(",").map((item) => item.trim())
        : [],
    });

    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
