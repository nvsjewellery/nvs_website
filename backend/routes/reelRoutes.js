const express = require("express");
const {
  getActiveReels,
  getAllReels,
  createReel,
  updateReel,
  deleteReel,
} = require("../controllers/reelController");

const router = express.Router();

// Public route for customer app
router.get("/active", getActiveReels);

// Admin routes (attach auth middleware here if needed)
router.get("/", getAllReels);
router.post("/", createReel);
router.put("/:id", updateReel);
router.delete("/:id", deleteReel);

module.exports = router;