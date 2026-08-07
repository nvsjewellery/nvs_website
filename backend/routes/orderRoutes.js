const express = require('express');
const router = express.Router();
const {
  initiatePayment,
  verifyAndPlaceOrder,
  getMyOrders,
  getOrderById,
} = require('../controllers/orderController');

router.post('/initiate-payment', initiatePayment);
router.post('/verify-and-place', verifyAndPlaceOrder);
router.get('/', getMyOrders);
router.get('/:orderId', getOrderById);

module.exports = router;