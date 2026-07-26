const { getLiveRates } = require("../lib/liveRates");

const GST_RATE = 0.03;

async function calcGoldPrice(p) {
  const { gold } = await getLiveRates();
  const rate = gold[p.purity] ?? 0;
  const net = Math.max(0, (p.grossWeight ?? 0) - (p.stoneWeight ?? 0));
  const metalVal = net * rate;
  const making = metalVal * ((p.va ?? 0) / 100);
  const subtotal = metalVal + making + (p.stoneCost ?? 0);
  const gst = subtotal * GST_RATE;
  return { net, total: Math.round(subtotal + gst) };
}

async function calcSilverPrice(p) {
  if (p.isDirectSterling) {
    const sub = p.pieceCost ?? 0;
    const gst = sub * GST_RATE;
    return { net: 0, total: Math.round(sub + gst) };
  }
  const { silver } = await getLiveRates();
  const rate = silver[p.purity] ?? 0;
  const net = Math.max(0, (p.grossWeight ?? 0) - (p.stoneWeight ?? 0));
  const metalVal = net * rate;
  const making = metalVal * ((p.va ?? 0) / 100);
  const subtotal = metalVal + making + (p.stoneCost ?? 0);
  const gst = subtotal * GST_RATE;
  return { net, total: Math.round(subtotal + gst) };
}

async function computeProductPricing(p) {
  return p.metal === "Gold" ? calcGoldPrice(p) : calcSilverPrice(p);
}

module.exports = { computeProductPricing };