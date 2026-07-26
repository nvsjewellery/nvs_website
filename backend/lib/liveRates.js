const RATES_URL = "https://suvarnagold-16e5.vercel.app/api/rates";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — avoid hammering the external API

let cache = null;
let cachedAt = 0;

function parseRupee(str) {
  return Number(String(str).replace(/[₹,]/g, ""));
}

async function fetchLiveRates() {
  const res = await fetch(RATES_URL);
  if (!res.ok) throw new Error("Failed to fetch live rates");
  const data = await res.json();

  const gold24 = parseRupee(data.gold24);
  const gold22 = parseRupee(data.gold22);
  const gold18 = parseRupee(data.gold18);
  const silverBase = parseRupee(data.silver); // quoted at ~999 (fine) purity

  // 9K/14K aren't provided by the feed — derive from 24K using standard karat ratios
  const gold = {
    "24K": gold24,
    "22K": gold22,
    "18K": gold18,
    "14K": Math.round(gold24 * (14 / 24)),
    "9K": Math.round(gold24 * (9 / 24)),
  };

  // Silver purities derived as a fraction of the quoted fine-silver rate
  const silver = {
    "92.5": Math.round(silverBase * 0.925),
    "83.5": Math.round(silverBase * 0.835),
    "80": Math.round(silverBase * 0.80),
    "75": Math.round(silverBase * 0.75),
  };

  return { gold, silver, source: data.source, updatedAt: data.updatedAt };
}

async function getLiveRates() {
  const now = Date.now();
  if (cache && now - cachedAt < CACHE_TTL_MS) {
    return cache;
  }
  try {
    const fresh = await fetchLiveRates();
    cache = fresh;
    cachedAt = now;
    return fresh;
  } catch (err) {
    if (cache) return cache; // serve last-known-good rates if the feed is temporarily down
    throw err;
  }
}

module.exports = { getLiveRates };