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

// ============================================================
// IMPORT ROUTES
// ============================================================

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

const {
  protect,
} = require("./middleware/authMiddleware");

// ============================================================
// APP
// ============================================================

const app = express();

// ============================================================
// ALLOWED ORIGINS
// ============================================================

const allowedOrigins = [
  "https://nvsjewellery.com",
  "https://www.nvsjewellery.com",
  "http://localhost:8080",
  "http://localhost:5173",
];

// ============================================================
// CORS
// ============================================================
//
// Explicit manual CORS handling is kept first because the
// backend is also deployed on Vercel serverless.
// ============================================================

app.use((req, res, next) => {
  const origin = req.headers.origin;

  const isAllowed =
    !origin ||
    allowedOrigins.includes(origin) ||
    (process.env.CLIENT_URL &&
      origin === process.env.CLIENT_URL) ||
    origin.endsWith(".vercel.app");

  if (isAllowed && origin) {
    res.setHeader(
      "Access-Control-Allow-Origin",
      origin
    );
  }

  res.setHeader(
    "Access-Control-Allow-Credentials",
    "true"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept"
  );

  // ----------------------------------------------------------
  // OPTIONS PREFLIGHT
  // ----------------------------------------------------------

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});

// ============================================================
// HELMET
// ============================================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

// ============================================================
// BODY PARSERS
// ============================================================

app.use(
  express.json({
    limit: "10kb",
  })
);

app.use(cookieParser());

// ============================================================
// LOGGER
// ============================================================

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ============================================================
// HEALTH / ROOT
// ============================================================

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "NVS Backend API Active",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

// ============================================================
// PUBLIC API ROUTES
// ============================================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/products",
  productRoutes
);

app.use(
  "/api/categories",
  categoryRoutes
);

app.use(
  "/api/rates",
  ratesRoutes
);

app.use(
  "/api/reels",
  reelRoutes
);

// ============================================================
// PROTECTED API ROUTES
// ============================================================

app.use(
  "/api/addresses",
  protect,
  addressRoutes
);

app.use(
  "/api/wishlist",
  protect,
  wishlistRoutes
);

app.use(
  "/api/cart",
  protect,
  cartRoutes
);

app.use(
  "/api/shiprocket",
  protect,
  shiprocketRoutes
);

app.use(
  "/api/orders",
  protect,
  orderRoutes
);

// ============================================================
// DISCOUNTS
// ============================================================
//
// IMPORTANT:
//
// /api/discounts/available needs req.user because the
// customer discount controller checks:
//
//     req.user?.id
//
// Therefore the protect middleware MUST run before the
// customer discount routes.
//
// This allows the backend to identify the logged-in customer
// and return only the CUSTOMER discount assigned to them.
//
// ============================================================

app.use(
  "/api/discounts",
  protect,
  customerDiscountRoutes
);

// ============================================================
// 404 HANDLER
// ============================================================

app.use(notFound);

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(errorHandler);

// ============================================================
// LOCAL DATABASE CONNECTION
// ============================================================
//
// Vercel manages the serverless process itself.
// Local development starts the Express server here.
// ============================================================

if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 5000;

  prisma
    .$connect()
    .then(() => {
      console.log(
        "✅ PostgreSQL connected via Prisma"
      );

      app.listen(PORT, () => {
        console.log(
          `🚀 Server running on port ${PORT}`
        );
      });
    })
    .catch((err) => {
      console.error(
        "❌ DB connection failed:",
        err.message
      );
    });
}

// ============================================================
// EXPORT APP
// ============================================================

module.exports = app;