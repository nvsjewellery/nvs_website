const asyncHandler = require("express-async-handler");
const { getLiveRates } = require("../lib/liveRates");

const getRates = asyncHandler(async (req, res) => {
  const rates = await getLiveRates();
  res.status(200).json({ success: true, rates });
});

module.exports = { getRates };