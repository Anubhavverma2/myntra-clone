const express = require("express");
const DeviceToken = require("../models/DeviceToken");
const NotificationJob = require("../models/NotificationJob");
const { enqueueNotification } = require("../services/notificationQueue");
const router = express.Router();

router.post("/register-token", async (req, res) => {
  try {
    const { userId, token, platform = "android" } = req.body;
    if (!userId || !token) {
      return res.status(400).json({ message: "userId and token required" });
    }

    const device = await DeviceToken.findOneAndUpdate(
      { token },
      { userId, platform, isValid: true },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Token registered", device });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.delete("/token/:token", async (req, res) => {
  try {
    await DeviceToken.findOneAndUpdate({ token: req.params.token }, { isValid: false });
    res.status(200).json({ message: "Token invalidated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.post("/send", async (req, res) => {
  try {
    const { userId, title, body, data, type = "realtime", scheduledAt } = req.body;
    if (!userId || !title || !body) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const result = await enqueueNotification({ userId, title, body, data, type, scheduledAt });
    res.status(result.queued ? 201 : 429).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.post("/schedule/cart-abandonment", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const scheduledAt = new Date(Date.now() + 30 * 60 * 1000);
    const result = await enqueueNotification({
      userId,
      title: "Items waiting in your bag!",
      body: "Complete your purchase before they sell out.",
      data: { screen: "bag" },
      type: "scheduled",
      scheduledAt,
    });

    res.status(201).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/jobs/:userId", async (req, res) => {
  try {
    const jobs = await NotificationJob.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json(jobs);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
