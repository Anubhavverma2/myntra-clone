const express = require("express");
const Product = require("../models/Product");
const Category = require("../models/Category");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    res.status(200).json(products);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/category/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const products = await Product.find({
      isActive: true,
      $or: [{ categoryId: categoryId }, { _id: { $in: category.productId || [] } }],
    });

    res.status(200).json(products);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, brand, price, discount, description, sizes, images, categoryId } = req.body;
    if (!name || !brand || !price || !images?.length) {
      return res.status(400).json({ message: "Name, brand, price and images are required" });
    }

    let categoryName = "";
    if (categoryId) {
      const cat = await Category.findById(categoryId);
      categoryName = cat?.name || "";
    }

    const product = new Product({
      name,
      brand,
      price,
      discount: discount || "",
      description: description || "",
      sizes: Array.isArray(sizes) ? sizes : sizes ? sizes.split(",").map((s) => s.trim()) : ["Free Size"],
      images: Array.isArray(images) ? images : [images],
      categoryId: categoryId || undefined,
      category: categoryName,
    });

    const savedProduct = await product.save();

    if (categoryId) {
      await Category.findByIdAndUpdate(categoryId, {
        $addToSet: { productId: savedProduct._id },
      });
    }

    res.status(201).json(savedProduct);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
