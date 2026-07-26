const express = require("express");
const { getRates } = require("../controllers/ratesController");

const router = express.Router();
router.get("/", getRates);

module.exports = router;