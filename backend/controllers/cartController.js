const asyncHandler = require("express-async-handler");
const prisma = require("../lib/prisma");

// GET /api/cart
const getCart = asyncHandler(async (req, res) => {
  const cart = await prisma.cart.findMany({
    where: {
      userId: req.user.id,
    },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.json({
    success: true,
    cart: cart.map((item) => ({
      productId: item.productId,
      qty: item.qty,
    })),
  });
});

// POST /api/cart
const addToCart = asyncHandler(async (req, res) => {
  const { productId, qty = 1 } = req.body;

  if (!productId) {
    res.status(400);
    throw new Error("Product ID required");
  }

  const existing = await prisma.cart.findUnique({
    where: {
      userId_productId: {
        userId: req.user.id,
        productId,
      },
    },
  });

  if (existing) {
    await prisma.cart.update({
      where: {
        id: existing.id,
      },
      data: {
        qty: existing.qty + qty,
      },
    });
  } else {
    await prisma.cart.create({
      data: {
        userId: req.user.id,
        productId,
        qty,
      },
    });
  }

  res.json({
    success: true,
  });
});

// PUT /api/cart/:productId
const updateCart = asyncHandler(async (req, res) => {
  const { qty } = req.body;
  const { productId } = req.params;

  if (qty <= 0) {
    await prisma.cart.deleteMany({
      where: {
        userId: req.user.id,
        productId,
      },
    });

    return res.json({
      success: true,
    });
  }

  await prisma.cart.updateMany({
    where: {
      userId: req.user.id,
      productId,
    },
    data: {
      qty,
    },
  });

  res.json({
    success: true,
  });
});

// DELETE /api/cart/:productId
const removeCart = asyncHandler(async (req, res) => {
  await prisma.cart.deleteMany({
    where: {
      userId: req.user.id,
      productId: req.params.productId,
    },
  });

  res.json({
    success: true,
  });
});

// DELETE /api/cart
const clearCart = asyncHandler(async (req, res) => {
  await prisma.cart.deleteMany({
    where: {
      userId: req.user.id,
    },
  });

  res.json({
    success: true,
  });
});

module.exports = {
  getCart,
  addToCart,
  updateCart,
  removeCart,
  clearCart,
};