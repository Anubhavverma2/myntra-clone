const NotificationJob = require("../models/NotificationJob");
const DeviceToken = require("../models/DeviceToken");

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_NOTIFICATIONS_PER_USER_PER_MINUTE = 5;
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

async function isRateLimited(userId) {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const sentCount = await NotificationJob.countDocuments({
    userId,
    status: "sent",
    sentAt: { $gte: since },
  });
  return sentCount >= MAX_NOTIFICATIONS_PER_USER_PER_MINUTE;
}

function isInvalidExpoTokenError(error) {
  return ["DeviceNotRegistered", "InvalidCredentials", "MessageTooBig"].includes(error);
}

async function postExpoMessages(messages) {
  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    throw new Error(`Expo push failed with HTTP ${response.status}`);
  }

  return response.json();
}

async function sendPushToUser(userId, title, body, data = {}) {
  const tokens = await DeviceToken.find({ userId, isValid: true });
  if (tokens.length === 0) {
    return { sent: 0, message: "No valid device tokens" };
  }

  const messages = tokens.map((device) => ({
    to: device.token,
    sound: "default",
    title,
    body,
    data,
  }));

  const result = await postExpoMessages(messages);
  let sent = 0;
  const invalidTokens = [];

  for (let index = 0; index < (result.data || []).length; index += 1) {
    const ticket = result.data[index];
    if (ticket.status === "ok") {
      sent += 1;
      tokens[index].lastUsedAt = new Date();
      await tokens[index].save();
    } else if (isInvalidExpoTokenError(ticket.details?.error)) {
      invalidTokens.push(tokens[index].token);
    }
  }

  if (invalidTokens.length > 0) {
    await DeviceToken.updateMany({ token: { $in: invalidTokens } }, { isValid: false });
  }

  return { sent };
}

async function enqueueNotification({ userId, title, body, data, type = "realtime", scheduledAt }) {
  if (await isRateLimited(userId)) {
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

  for (let i = 0; i < 20; i += 1) {
    const job = await NotificationJob.findOneAndUpdate(
      {
        status: "pending",
        scheduledAt: { $lte: now },
        attempts: { $lt: 3 },
      },
      { status: "processing" },
      { sort: { scheduledAt: 1 }, new: true }
    );

    if (!job) break;

    try {
      if (await isRateLimited(job.userId)) {
        job.status = "pending";
        job.scheduledAt = new Date(Date.now() + RATE_LIMIT_WINDOW_MS);
        await job.save();
        continue;
      }

      await sendPushToUser(job.userId, job.title, job.body, job.data);
      job.status = "sent";
      job.attempts += 1;
      job.sentAt = new Date();
      await job.save();
    } catch (err) {
      job.attempts += 1;
      job.lastError = err.message;

      if (job.attempts >= job.maxAttempts) {
        job.status = "failed";
      } else {
        job.status = "pending";
        job.scheduledAt = new Date(Date.now() + Math.pow(2, job.attempts) * 30000);
      }

      await job.save();
    }
  }
}

function startNotificationWorker() {
  setInterval(processPendingJobs, 15000);
  console.log("Notification worker started");
}

module.exports = {
  enqueueNotification,
  sendPushToUser,
  processPendingJobs,
  startNotificationWorker,
};
