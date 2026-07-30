const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");

// GET /api/addresses
router.get("/", async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.user?._id ||
      req.session?.userId ||
      req.userId ||
      req.cookies?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, addresses });
  } catch (error) {
    console.error("❌ Fetch addresses error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch addresses" });
  }
});

// POST /api/addresses
router.post("/", async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.user?._id ||
      req.session?.userId ||
      req.userId ||
      req.cookies?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { label, addressLine, city, pincode, isDefault } = req.body;

    if (!addressLine || !city || !pincode) {
      return res.status(400).json({
        success: false,
        message: "Address line, city, and pincode are required",
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        label: label || "Home",
        addressLine,
        city,
        pincode,
        isDefault: Boolean(isDefault),
      },
    });

    return res.status(201).json({ success: true, address });
  } catch (error) {
    console.error("❌ Prisma address creation error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create address" });
  }
});

// DELETE /api/addresses/:id
router.delete("/:id", async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.user?._id ||
      req.session?.userId ||
      req.userId ||
      req.cookies?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;

    const existing = await prisma.address.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    await prisma.address.delete({ where: { id } });
    return res.json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    console.error("❌ Delete address error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete address" });
  }
});

module.exports = router;