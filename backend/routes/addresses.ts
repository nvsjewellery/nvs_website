import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

// GET /api/addresses - Fetch all addresses for logged-in user
router.get("/", async (req: any, res: any) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const addresses = await (prisma as any).address.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, addresses });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch addresses" });
  }
});

// POST /api/addresses - Save a new address
router.post("/", async (req: any, res: any) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { label, addressLine, city, pincode, isDefault } = req.body;

    if (!addressLine || !city || !pincode) {
      return res.status(400).json({ success: false, message: "Address line, city, and pincode are required" });
    }

    const address = await (prisma as any).address.create({
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
    return res.status(500).json({ success: false, message: "Failed to create address" });
  }
});

// DELETE /api/addresses/:id - Delete an address
router.delete("/:id", async (req: any, res: any) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;

    const existing = await (prisma as any).address.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    await (prisma as any).address.delete({ where: { id } });
    return res.json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete address" });
  }
});

export default router;