const express = require("express");
const Bag = require("../models/Bag");
const Order = require("../models/Order");
const Transaction = require("../models/Transaction");
const TransactionAudit = require("../models/TransactionAudit");
const Product = require("../models/Product");
const router = express.Router();
const mongoose = require("mongoose");
const crypto = require("crypto");
const { enqueueNotification } = require("../services/notificationQueue");

function genrateRandomTracking() {
  const carriers = ["Delhivery", "Bluedart", "Ecom Express", "XpressBees"];
  const statusOptions = ["Shipped", "Out for Delivery", "Delivered", "In Transit"];
  const locations = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune"];
  const randomcarrier = carriers[Math.floor(Math.random() * carriers.length)];
  const randomstatusOptions = statusOptions[Math.floor(Math.random() * statusOptions.length)];
  const randomlocations = locations[Math.floor(Math.random() * locations.length)];

  return {
    number: "TRK" + Math.floor(Math.random() * 10000000),
    carrier: randomcarrier,
    estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    currentLocation: randomlocations,
    status: randomstatusOptions,
    timeline: [
      { status: "Order placed", location: "Warehouse", timestamp: new Date().toISOString() },
      { status: randomstatusOptions, location: randomlocations, timestamp: new Date().toISOString() },
    ],
  };
}

router.post("/create/:userId", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userid = req.params.userId;
    const bag = await Bag.find({ userId: userid, section: "active" })
      .populate("productId")
      .session(session);

    if (bag.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: "No active items in the bag" });
    }

    const issues = [];
    for (const item of bag) {
      if (item.productId?.isActive === false || item.productId?.isDiscontinued === true) {
        issues.push(`${item.productId?.name || "Item"} is no longer available`);
      } else if (item.productId.stock <= 0) {
        issues.push(`${item.productId.name} is out of stock`);
      } else if (item.productId.stock < item.quantity) {
        issues.push(`Only ${item.productId.stock} ${item.productId.name} available`);
      } else if (item.priceAtAdd !== item.productId.price) {
        item.priceAtAdd = item.productId.price;
        item.version += 1;
        await item.save({ session });
        issues.push(`${item.productId.name} price changed. Please review your bag.`);
      }
    }
    if (issues.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Checkout validation failed", issues });
    }

    const orderitem = bag.map((item) => ({
      productId: item.productId._id,
      size: item.size,
      price: item.productId.price,
      quantity: item.quantity,
    }));

    const total = orderitem.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const paymentMethod = req.body.paymentMethod || "Card";

    const newOrder = new Order({
      userId: userid,
      date: new Date().toISOString(),
      status: "Processing",
      items: orderitem,
      total,
      shippingAddress: req.body.shippingAddress || "",
      paymentMethod,
      tracking: genrateRandomTracking(),
    });
    const savedOrder = await newOrder.save({ session });

    const invoiceId = `INV-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const transaction = await Transaction.create(
      [
        {
          userId: userid,
          orderId: savedOrder._id,
          invoiceId,
          paymentMode: paymentMethod,
          amount: total,
          status: "success",
        },
      ],
      { session }
    );

    await TransactionAudit.create(
      [{ transactionId: transaction[0]._id, event: "created", details: { orderId: savedOrder._id } }],
      { session }
    );
    await TransactionAudit.create(
      [{ transactionId: transaction[0]._id, event: "success", details: { amount: total } }],
      { session }
    );

    for (const item of bag) {
      const stockUpdate = await Product.updateOne(
        {
          _id: item.productId._id,
          stock: { $gte: item.quantity },
          isActive: { $ne: false },
          isDiscontinued: { $ne: true },
        },
        { $inc: { stock: -item.quantity, purchaseCount: item.quantity } },
        { session }
      );
      if (stockUpdate.modifiedCount !== 1) {
        await session.abortTransaction();
        return res.status(409).json({ message: "Stock changed while placing order. Please review your bag." });
      }
    }

    await Bag.deleteMany({ userId: userid, section: "active" }, { session });
    await session.commitTransaction();

    await enqueueNotification({
      userId: userid,
      title: "Order Placed Successfully!",
      body: `Your order of ₹${total} has been confirmed.`,
      data: { screen: "orders", orderId: savedOrder._id.toString() },
    });

    res.status(201).json({ order: savedOrder, transaction: transaction[0] });
  } catch (error) {
    await session.abortTransaction();
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  } finally {
    session.endSession();
  }
});

router.get("/user/:userid", async (req, res) => {
  try {
    const order = await Order.find({ userId: req.params.userid }).populate("items.productId");
    res.status(200).json(order);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
