require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const prisma = require("./lib/prisma");

const {
  notFound,
  errorHandler,
} = require("./middleware/errorMiddleware");

// Routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const ratesRoutes = require("./routes/ratesRoutes");
const addressRoutes = require("./routes/addressRoutes");
const orderRoutes = require("./routes/orderRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const cartRoutes = require("./routes/cartRoutes");
const reelRoutes = require("./routes/reelRoutes");
const shiprocketRoutes = require("./routes/shiprocket");
const customerDiscountRoutes = require("./routes/customerDiscountRoutes");

const { protect } = require("./middleware/authMiddleware");

const app = express();
app.disable("x-powered-by");

const allowedOrigins = [
  "https://nvsjewellery.com",
  "https://www.nvsjewellery.com",
  "http://localhost:8080",
  "http://localhost:5173",
];

// ============================================================
// CORS (Standard Middleware)
// ============================================================
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.includes(origin) ||
        (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) ||
        origin.endsWith(".vercel.app");

      if (isAllowed) {
        return callback(null, true);
      } else {
        return callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    optionsSuccessStatus: 200,
  })
);

// Explicit OPTIONS preflight handling across all routes
app.options("*", cors());

// ============================================================
// HELMET
// ============================================================
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "NVS Backend Active" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Public Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/rates", ratesRoutes);
app.use("/api/reels", reelRoutes);

// Protected Routes
app.use("/api/addresses", protect, addressRoutes);
app.use("/api/wishlist", protect, wishlistRoutes);
app.use("/api/cart", protect, cartRoutes);
app.use("/api/shiprocket", protect, shiprocketRoutes);
app.use("/api/orders", protect, orderRoutes);
app.use("/api/discounts", protect, customerDiscountRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 5000;
  prisma
    .$connect()
    .then(() => {
      console.log("✅ PostgreSQL connected");
      app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
    })
    .catch((err) => console.error("❌ DB connection failed:", err.message));
}

module.exports = app;