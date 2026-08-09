const express = require("express");

const {
  getAvailableDiscounts,
  validateCoupon,
} = require("../controllers/customerDiscountController");

const router = express.Router();

// These routes expect req.user to already be populated
// by your customer authentication middleware.

router.get("/available", getAvailableDiscounts);

router.post("/validate-coupon", validateCoupon);

module.exports = router;