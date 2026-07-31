const asyncHandler = require("express-async-handler");
const prisma = require("../lib/prisma");

// GET /api/wishlist
const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await prisma.wishlist.findMany({
    where: {
      userId: req.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.json({
    success: true,
    wishlist: wishlist.map((item) => item.productId),
  });
});

// POST /api/wishlist
const addWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    res.status(400);
    throw new Error("Product ID required");
  }

  const existing = await prisma.wishlist.findUnique({
    where: {
      userId_productId: {
        userId: req.user.id,
        productId,
      },
    },
  });

  if (!existing) {
    await prisma.wishlist.create({
      data: {
        userId: req.user.id,
        productId,
      },
    });
  }

  res.json({
    success: true,
  });
});

// DELETE /api/wishlist/:productId
const removeWishlist = asyncHandler(async (req, res) => {
  await prisma.wishlist.deleteMany({
    where: {
      userId: req.user.id,
      productId: req.params.productId,
    },
  });

  res.json({
    success: true,
  });
});

module.exports = {
  getWishlist,
  addWishlist,
  removeWishlist,
};