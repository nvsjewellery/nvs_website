const express = require('express');
const router = express.Router();
const {
  createOrder,
  assignAwb,
  trackOrder,
  getOrderDetails,
  checkServiceability,
  generatePickup,
  generateManifest,
  printManifest,
  generateLabel,
  printInvoice,
  cancelOrder,

} = require('../services/shiprocketService');

// 1. Create order
router.post('/orders', async (req, res) => {
  try {
    const order = req.body;
    const payload = {
      order_id: order.orderId,
      order_date: order.orderDate,
      pickup_location: "Primary",
      billing_customer_name: order.customerName,
      billing_last_name: order.customerLastName || "NA",
      billing_address: order.address,
      billing_city: order.city,
      billing_pincode: order.pincode,
      billing_state: order.state,
      billing_country: "India",
      billing_email: order.email,
      billing_phone: order.phone,
      shipping_is_billing: true,
      order_items: order.items.map(i => ({
        name: i.name, sku: i.sku, units: i.qty, selling_price: i.price,
      })),
      payment_method: order.paymentMethod,
      sub_total: order.subTotal,
      length: order.length,
      breadth: order.breadth,
      height: order.height,
      weight: order.weight,
    };
    const data = await createOrder(payload);
    res.json({ success: true, shiprocket: data });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// 2. Assign AWB
router.post('/orders/:shipmentId/assign-awb', async (req, res) => {
  try {
    const data = await assignAwb(req.params.shipmentId);
    res.json({ success: true, awb: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// 3. Track by AWB
router.get('/track/:awbCode', async (req, res) => {
  try {
    const data = await trackOrder(req.params.awbCode);
    res.json({ success: true, tracking: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// 4. Get order details
router.get('/orders/:srOrderId', async (req, res) => {
  try {
    const data = await getOrderDetails(req.params.srOrderId);
    res.json({ success: true, order: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// 5. Serviceability
router.get('/serviceability', async (req, res) => {
  try {
    const { pickup_pincode, delivery_pincode, weight, cod } = req.query;
    const data = await checkServiceability(pickup_pincode, delivery_pincode, weight, cod === 'true');
    res.json({ success: true, couriers: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// 6. Generate pickup
router.post('/orders/:shipmentId/generate-pickup', async (req, res) => {
  try {
    const data = await generatePickup(req.params.shipmentId);
    res.json({ success: true, pickup: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// 7. Generate manifest
router.post('/orders/:shipmentId/generate-manifest', async (req, res) => {
  try {
    const data = await generateManifest(req.params.shipmentId);
    res.json({ success: true, manifest: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// 8. Print manifest
router.post('/orders/:orderId/print-manifest', async (req, res) => {
  try {
    const data = await printManifest([req.params.orderId]);
    res.json({ success: true, manifestPdf: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// 9. Generate label
router.post('/orders/:shipmentId/generate-label', async (req, res) => {
  try {
    const data = await generateLabel(req.params.shipmentId);
    res.json({ success: true, label: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// 10. Print invoice
router.post('/orders/:orderId/print-invoice', async (req, res) => {
  try {
    const data = await printInvoice([req.params.orderId]);
    res.json({ success: true, invoicePdf: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

router.post('/orders/:orderId/cancel', async (req, res) => {
  try {
    const data = await cancelOrder([req.params.orderId]);
    res.json({ success: true, cancellation: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});


module.exports = router;