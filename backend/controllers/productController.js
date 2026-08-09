const asyncHandler = require("express-async-handler");
const prisma = require("../lib/prisma");
const { computeProductPricing } = require("../utils/pricing");

/* ============================================================
   CONVERT DATABASE PRODUCT TO CUSTOMER FRONTEND SHAPE
============================================================ */

async function toFrontendShape(p) {
  const pricing = await computeProductPricing(p);

  return {
    id: p.id,
    name: p.name,

    metal: p.metal,

    sub: p.category,

    category: p.category,

    purity: p.purity,

    weight: pricing.net,

    price: pricing.total,

    metalValue: pricing.metalValue,

    making: pricing.making,

    gst: pricing.gst,

    gemstone:
      (p.stoneCost ?? 0) > 0
        ? "Diamond"
        : "None",

    /* ========================================================
       PRIMARY IMAGE
       Backward compatibility
    ======================================================== */

    image: p.image || "",

    /* ========================================================
       PRODUCT GALLERY
       New images[] field from Prisma
    ======================================================== */

    images: Array.isArray(p.images)
      ? p.images.filter(
          (img) =>
            typeof img === "string" &&
            img.trim().length > 0
        )
      : [],
  };
}

/* ============================================================
   GET ALL PRODUCTS
============================================================ */

const getProducts = asyncHandler(
  async (req, res) => {
    const {
      metal,
      category,
    } = req.query;

    const products =
      await prisma.product.findMany({
        where: {
          status: "Active",

          ...(metal
            ? { metal }
            : {}),

          ...(category
            ? { category }
            : {}),
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    const shaped =
      await Promise.all(
        products.map(
          toFrontendShape
        )
      );

    res.status(200).json({
      success: true,
      products: shaped,
    });
  }
);

/* ============================================================
   GET PRODUCT BY ID
============================================================ */

const getProductById =
  asyncHandler(
    async (req, res) => {
      const { id } =
        req.params;

      const product =
        await prisma.product.findFirst({
          where: {
            id,
            status: "Active",
          },
        });

      if (!product) {
        res.status(404);

        throw new Error(
          "Product not found"
        );
      }

      const shaped =
        await toFrontendShape(
          product
        );

      res.status(200).json({
        success: true,
        product: shaped,
      });
    }
  );

/* ============================================================
   EXPORTS
============================================================ */

module.exports = {
  getProducts,
  getProductById,
};