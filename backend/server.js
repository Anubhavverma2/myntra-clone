const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");

const userrouter = require("./routes/Userroutes");
const categoryrouter = require("./routes/Categoryroutes");
const productrouter = require("./routes/Productroutes");
const Bagroutes = require("./routes/Bagroutes");
const Wishlistroutes = require("./routes/Wishlistroutes");
const OrderRoutes = require("./routes/OrderRoutes");
const RecentlyViewedroutes = require("./routes/RecentlyViewedroutes");
const Transactionroutes = require("./routes/Transactionroutes");
const Recommendationroutes = require("./routes/Recommendationroutes");
const Notificationroutes = require("./routes/Notificationroutes");
const { startNotificationWorker } = require("./services/notificationQueue");

dotenv.config();
console.log("🔥 SERVER VERSION: JULY-10-TEST");

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
console.log("DNS:", dns.getServers());


const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Myntra Backend Live",
    time: new Date()
  });
});

app.use("/user", userrouter);
app.use("/category", categoryrouter);
app.use("/product", productrouter);
app.use("/bag", Bagroutes);
app.use("/wishlist", Wishlistroutes);
app.use("/order", OrderRoutes);
app.use("/recently-viewed", RecentlyViewedroutes);
app.use("/transactions", Transactionroutes);
app.use("/recommendations", Recommendationroutes);
app.use("/notifications", Notificationroutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found", path: req.originalUrl });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    startNotificationWorker();
  })
  .catch((err) => console.log("Mongo Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
