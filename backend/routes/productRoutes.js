const express = require("express");
const { getProducts, getProductById } = require("../controllers/productController");

const router = express.Router();

// No auth middleware — these are public storefront endpoints
router.get("/", getProducts);
router.get("/:id", getProductById);

module.exports = router;