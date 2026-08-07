const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createRazorpayOrder(amountInRupees) {
  return razorpay.orders.create({
    amount: Math.round(amountInRupees * 100), // paise
    currency: 'INR',
    receipt: `rcpt_${Date.now()}`,
  });
}

function verifyPaymentSignature(orderId, paymentId, signature) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}

module.exports = { createRazorpayOrder, verifyPaymentSignature };