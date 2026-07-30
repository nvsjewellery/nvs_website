const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");

/*
|--------------------------------------------------------------------------
| GET /api/addresses
|--------------------------------------------------------------------------
| Returns all addresses belonging to the logged-in user
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    });

    return res.status(200).json({
      success: true,
      addresses,
    });
  } catch (err) {
    console.error("GET Addresses:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch addresses",
    });
  }
});

/*
|--------------------------------------------------------------------------
| POST /api/addresses
|--------------------------------------------------------------------------
| Create a new address
|--------------------------------------------------------------------------
*/

router.post("/", async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      label,
      addressLine,
      city,
      pincode,
      isDefault = false,
    } = req.body;

    if (!addressLine || !city || !pincode) {
      return res.status(400).json({
        success: false,
        message: "Address, City and Pincode are required.",
      });
    }

    // Only one default address
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        label: label || "Home",
        addressLine,
        city,
        pincode,
        isDefault,
      },
    });

    return res.status(201).json({
      success: true,
      address,
    });
  } catch (err) {
    console.error("POST Address:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to save address",
    });
  }
});

/*
|--------------------------------------------------------------------------
| DELETE /api/addresses/:id
|--------------------------------------------------------------------------
*/

router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user.id;

    const { id } = req.params;

    const address = await prisma.address.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    await prisma.address.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (err) {
    console.error("DELETE Address:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to delete address",
    });
  }
});

module.exports = router;