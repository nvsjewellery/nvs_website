const asyncHandler = require("express-async-handler");
const prisma = require("../lib/prisma");
const { computeProductPricing } = require("../utils/pricing");

async function toFrontendShape(p) {
  const pricing = await computeProductPricing(p);
  return {
    id: p.id,
    name: p.name,
    metal: p.metal,
    sub: p.category,
    purity: p.purity,
    weight: pricing.net,
    price: pricing.total,
    metalValue: pricing.metalValue,
    making: pricing.making,
    gst: pricing.gst,
    gemstone: (p.stoneCost ?? 0) > 0 ? "Diamond" : "None",
    image: p.image,
  };
}

const getProducts = asyncHandler(async (req, res) => {
  const { metal, category } = req.query;

  const products = await prisma.product.findMany({
    where: {
      status: "Active",
      ...(metal ? { metal } : {}),
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const shaped = await Promise.all(products.map(toFrontendShape));
  res.status(200).json({ success: true, products: shaped });
});

const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findFirst({
    where: { id, status: "Active" },
  });

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.status(200).json({ success: true, product: await toFrontendShape(product) });
});

module.exports = { getProducts, getProductById };