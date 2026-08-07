// shiprocketAuth.js
const axios = require('axios');

let cachedToken = null;
let tokenExpiry = null;

async function getShiprocketToken() {
  if (cachedToken && tokenExpiry > Date.now()) {
    return cachedToken;
  }
  
  console.log( process.env.SHIPROCKET_EMAIL, process.env.SHIPROCKET_PASSWORD);
  const res = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
    email: process.env.SHIPROCKET_EMAIL,
    password: process.env.SHIPROCKET_PASSWORD,
  });

  cachedToken = res.data.token;
  tokenExpiry = Date.now() + 239 * 60 * 60 * 1000; // refresh a bit before 240h
  return cachedToken;
}

module.exports = { getShiprocketToken };

