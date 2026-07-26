const asyncHandler = require("express-async-handler");
const prisma = require("../lib/prisma");

// @desc Get all categories (public)
// @route GET /api/categories
const getCategories = asyncHandler(async (req, res) => {
  const { metal } = req.query;

  const categories = await prisma.category.findMany({
    where: metal ? { metal } : {},
    orderBy: [{ metal: "asc" }, { sortOrder: "asc" }],
  });

  res.status(200).json({ success: true, categories });
});

module.exports = { getCategories };