require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const prisma = require("./lib/prisma");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const ratesRoutes = require("./routes/ratesRoutes");
const addressRoutes = require("./routes/addressRoutes");
const { protect } = require("./middleware/authMiddleware");

const wishlistRoutes = require("./routes/wishlistRoutes");
const cartRoutes = require("./routes/cartRoutes");
const reelRoutes = require("./routes/reelRoutes");

const app = express();

const allowedOrigins = [
  "https://nvsjewellery.com",
  "https://www.nvsjewellery.com",
  "http://localhost:8080",
  "http://localhost:5173",
];

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) {
        return callback(null, true);
      }
      if (origin.endsWith(".vercel.app")) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    // ADDED "PATCH" TO ALLOWED METHODS
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

// Root Health Check Route
app.get("/", (req, res) => res.json({ status: "ok", message: "NVS Backend API Active" }));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/rates", ratesRoutes);
app.use("/api/addresses", protect, addressRoutes);
app.use("/api/wishlist", protect, wishlistRoutes);
app.use("/api/cart", protect, cartRoutes);
app.use("/api/reels", reelRoutes);

app.use(notFound);
app.use(errorHandler);

// Only listen locally (not on Vercel)
if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 5000;
  prisma
    .$connect()
    .then(() => {
      console.log("✅ PostgreSQL connected via Prisma");
      app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error("❌ DB connection failed:", err.message);
    });
}

module.exports = app;