const express = require("express");

const {
  getWishlist,
  addWishlist,
  removeWishlist,
} = require("../controllers/wishlistController");

const router = express.Router();

// GET wishlist
router.get("/", getWishlist);

// ADD product
router.post("/", addWishlist);

// REMOVE product
router.delete("/:productId", removeWishlist);

module.exports = router;