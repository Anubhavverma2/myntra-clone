const NotificationJob = require("../models/NotificationJob");
const DeviceToken = require("../models/DeviceToken");

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_NOTIFICATIONS_PER_USER_PER_MINUTE = 5;
const userSendTimestamps = new Map();

function isRateLimited(userId) {
  const key = userId.toString();
  const now = Date.now();
  const timestamps = (userSendTimestamps.get(key) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= MAX_NOTIFICATIONS_PER_USER_PER_MINUTE) {
    return true;
  }
  timestamps.push(now);
  userSendTimestamps.set(key, timestamps);
  return false;
}

async function sendPushToUser(userId, title, body, data = {}) {
  const tokens = await DeviceToken.find({ userId, isValid: true });
  if (tokens.length === 0) {
    return { sent: 0, message: "No valid device tokens" };
  }

  let sent = 0;
  for (const device of tokens) {
    try {
      console.log(`[Push] → ${device.token.slice(0, 20)}... | ${title}: ${body}`);
      sent += 1;
    } catch (err) {
      if (err.message?.includes("Invalid") || err.message?.includes("not registered")) {
        device.isValid = false;
        await device.save();
      }
    }
  }
  return { sent };
}

async function enqueueNotification({ userId, title, body, data, type = "realtime", scheduledAt }) {
  if (isRateLimited(userId)) {
    return { queued: false, message: "Rate limit exceeded" };
  }

  const job = await NotificationJob.create({
    userId,
    title,
    body,
    data,
    type,
    scheduledAt: scheduledAt || new Date(),
  });
  return { queued: true, jobId: job._id };
}

async function processPendingJobs() {
  const now = new Date();
  const jobs = await NotificationJob.find({
    status: "pending",
    scheduledAt: { $lte: now },
    attempts: { $lt: 3 },
  }).limit(20);

  for (const job of jobs) {
    try {
      if (isRateLimited(job.userId)) {
        continue;
      }
      await sendPushToUser(job.userId, job.title, job.body, job.data);
      job.status = "sent";
      job.attempts += 1;
      await job.save();
    } catch (err) {
      job.attempts += 1;
      job.lastError = err.message;
      if (job.attempts >= job.maxAttempts) {
        job.status = "failed";
      }
      await job.save();
    }
  }
}

function startNotificationWorker() {
  setInterval(processPendingJobs, 15000);
  console.log("✅ Notification worker started");
}

module.exports = {
  enqueueNotification,
  sendPushToUser,
  processPendingJobs,
  startNotificationWorker,
};
