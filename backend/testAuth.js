require('dotenv').config();
const { getShiprocketToken } = require('./services/shiprocketAuth');

(async () => {
  try {
    const token = await getShiprocketToken();
    console.log('✅ Token received:');
    console.log(token);
  } catch (err) {
    console.error('❌ Auth failed:');
    console.error(err.response?.data || err.message);
  }
})();