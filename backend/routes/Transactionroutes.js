const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const TransactionAudit = require("../models/TransactionAudit");
const router = express.Router();

const VALID_STATUSES = new Set(["pending", "success", "failed", "refunded"]);
const VALID_SORT_FIELDS = new Set(["createdAt", "amount", "status", "paymentMode"]);
const VALID_PAYMENT_MODES = new Set(["UPI", "Card", "Net Banking", "COD", "Wallet"]);
const isObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

async function logAudit(transactionId, event, details = {}) {
  await TransactionAudit.create({ transactionId, event, details });
}

function escapeCsv(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

router.get("/user/:userId", async (req, res) => {
  try {
    if (!isObjectId(req.params.userId)) return res.status(400).json({ message: "Invalid userId" });
    const {
      status,
      paymentMode,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { userId: req.params.userId };
    if (status && VALID_STATUSES.has(status)) filter.status = status;
    if (paymentMode) filter.paymentMode = paymentMode;

    const safeSortBy = VALID_SORT_FIELDS.has(sortBy) ? sortBy : "createdAt";
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const sort = { [safeSortBy]: sortOrder === "asc" ? 1 : -1, _id: -1 };
    const skip = (safePage - 1) * safeLimit;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort(sort).skip(skip).limit(safeLimit).lean(),
      Transaction.countDocuments(filter),
    ]);

    res.status(200).json({
      transactions,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
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
    if (!isObjectId(userId)) return res.status(400).json({ message: "Invalid userId" });
    if (orderId && !isObjectId(orderId)) return res.status(400).json({ message: "Invalid orderId" });
    if (!VALID_PAYMENT_MODES.has(paymentMode)) return res.status(400).json({ message: "Invalid payment mode" });
    if (Number(amount) <= 0) return res.status(400).json({ message: "Amount must be positive" });

    const invoiceId = `INV-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const transaction = await Transaction.create({
      userId,
      orderId,
      invoiceId,
      paymentMode,
      amount: Number(amount),
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
    if (!isObjectId(transactionId)) return res.status(400).json({ message: "Invalid transactionId" });
    if (!VALID_STATUSES.has(status)) return res.status(400).json({ message: "Invalid status" });

    const existing = await Transaction.findOne({ webhookId });
    if (existing) {
      return res.status(200).json({ message: "Webhook already processed", transaction: existing });
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: transactionId, webhookId: { $exists: false } },
      {
        webhookId,
        status,
        ...(amount != null ? { amount: Number(amount) } : {}),
      },
      { new: true }
    );
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    await logAudit(transaction._id, "webhook_received", { status, webhookId });
    if (status === "success") await logAudit(transaction._id, "success");
    if (status === "failed") await logAudit(transaction._id, "failed");
    if (status === "refunded") await logAudit(transaction._id, "refund");

    res.status(200).json(transaction);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.webhookId) {
      const transaction = await Transaction.findOne({ webhookId: req.body.webhookId });
      return res.status(200).json({ message: "Webhook already processed", transaction });
    }
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/receipt/:transactionId", async (req, res) => {
  try {
    if (!isObjectId(req.params.transactionId)) {
      return res.status(400).json({ message: "Invalid transactionId" });
    }
    const transaction = await Transaction.findById(req.params.transactionId);
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    const receipt = [
      "MYNTRA CLONE - PAYMENT RECEIPT",
      "================================",
      `Invoice ID: ${transaction.invoiceId}`,
      `Transaction ID: ${transaction._id}`,
      `Generated At: ${new Date().toISOString()}`,
      `Paid At: ${transaction.updatedAt.toISOString()}`,
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
    if (!isObjectId(req.params.userId)) return res.status(400).json({ message: "Invalid userId" });
    const filter = { userId: req.params.userId };
    if (req.query.status && VALID_STATUSES.has(req.query.status)) filter.status = req.query.status;
    if (req.query.paymentMode) filter.paymentMode = req.query.paymentMode;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="transactions-${req.params.userId}.csv"`);

    res.write("Invoice ID,Amount,Payment Mode,Status,Date\n");

    const cursor = Transaction.find(filter)
      .sort({ createdAt: -1 })
      .cursor();

    for await (const txn of cursor) {
      res.write([
        escapeCsv(txn.invoiceId),
        txn.amount,
        escapeCsv(txn.paymentMode),
        escapeCsv(txn.status),
        escapeCsv(txn.createdAt.toISOString()),
      ].join(",") + "\n");
    }

    res.end();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.get("/audit/:transactionId", async (req, res) => {
  try {
    if (!isObjectId(req.params.transactionId)) {
      return res.status(400).json({ message: "Invalid transactionId" });
    }
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
