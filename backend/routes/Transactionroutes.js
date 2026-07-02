const express = require("express");
const crypto = require("crypto");
const Transaction = require("../models/Transaction");
const TransactionAudit = require("../models/TransactionAudit");
const router = express.Router();

async function logAudit(transactionId, event, details = {}) {
  await TransactionAudit.create({ transactionId, event, details });
}

router.get("/user/:userId", async (req, res) => {
  try {
    const {
      status,
      paymentMode,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { userId: req.params.userId };
    if (status) filter.status = status;
    if (paymentMode) filter.paymentMode = paymentMode;

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
    const skip = (Math.max(parseInt(page, 10), 1) - 1) * parseInt(limit, 10);

    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort(sort).skip(skip).limit(parseInt(limit, 10)).lean(),
      Transaction.countDocuments(filter),
    ]);

    res.status(200).json({
      transactions,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId, orderId, paymentMode, amount } = req.body;
    if (!userId || !paymentMode || amount == null) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const invoiceId = `INV-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const transaction = await Transaction.create({
      userId,
      orderId,
      invoiceId,
      paymentMode,
      amount,
      status: "pending",
    });

    await logAudit(transaction._id, "created", { paymentMode, amount });
    res.status(201).json(transaction);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.post("/webhook", async (req, res) => {
  try {
    const { webhookId, transactionId, status, amount } = req.body;
    if (!webhookId || !transactionId || !status) {
      return res.status(400).json({ message: "Missing webhook fields" });
    }

    const existing = await Transaction.findOne({ webhookId });
    if (existing) {
      return res.status(200).json({ message: "Webhook already processed", transaction: existing });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    transaction.webhookId = webhookId;
    transaction.status = status;
    if (amount != null) transaction.amount = amount;
    await transaction.save();

    await logAudit(transaction._id, "webhook_received", { status, webhookId });
    if (status === "success") await logAudit(transaction._id, "success");
    if (status === "failed") await logAudit(transaction._id, "failed");
    if (status === "refunded") await logAudit(transaction._id, "refund");

    res.status(200).json(transaction);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/receipt/:transactionId", async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId);
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    const receipt = [
      "MYNTRA CLONE - PAYMENT RECEIPT",
      "================================",
      `Invoice ID: ${transaction.invoiceId}`,
      `Transaction ID: ${transaction._id}`,
      `Date: ${transaction.createdAt.toISOString()}`,
      `Payment Mode: ${transaction.paymentMode}`,
      `Amount: ₹${transaction.amount}`,
      `Status: ${transaction.status.toUpperCase()}`,
      "================================",
      "Thank you for shopping with us!",
    ].join("\n");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="receipt-${transaction.invoiceId}.pdf"`
    );

    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument();
    doc.pipe(res);
    doc.fontSize(18).text("MYNTRA CLONE", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(receipt);
    doc.end();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/export/:userId/csv", async (req, res) => {
  try {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="transactions-${req.params.userId}.csv"`);

    res.write("Invoice ID,Amount,Payment Mode,Status,Date\n");

    const cursor = Transaction.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .cursor();

    for await (const txn of cursor) {
      res.write(
        `"${txn.invoiceId}",${txn.amount},"${txn.paymentMode}","${txn.status}","${txn.createdAt.toISOString()}"\n`
      );
    }

    res.end();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/audit/:transactionId", async (req, res) => {
  try {
    const logs = await TransactionAudit.find({ transactionId: req.params.transactionId }).sort({
      createdAt: 1,
    });
    res.status(200).json(logs);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
