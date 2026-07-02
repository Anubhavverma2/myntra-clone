const express = require("express");
const { getRecommendations } = require("../services/recommendationEngine");
const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 8;
    const result = await getRecommendations(req.params.userId, limit);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 8;
    const result = await getRecommendations(null, limit);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
