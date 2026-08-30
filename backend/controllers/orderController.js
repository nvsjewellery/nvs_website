const prisma = require('../lib/prisma');
const { createRazorpayOrder, verifyPaymentSignature } = require('../services/razorpayService');
const { computeProductPricing } = require('../utils/pricing');

async function calculateCartTotal(userId) {
  const cartItems = await prisma.cart.findMany({
    where: { userId },
    include: { product: true },
  });

  let subTotal = 0;
  for (const item of cartItems) {
    const pricing = await computeProductPricing(item.product);
    subTotal += pricing.total * item.qty;
  }

  return { cartItems, subTotal };
}

// STEP 1 — called when customer clicks "Place Order", BEFORE Razorpay opens
async function initiatePayment(req, res) {
  try {
    const userId = req.user.id;
    const { subTotal } = await calculateCartTotal(userId);

    if (subTotal <= 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const rzpOrder = await createRazorpayOrder(subTotal);
    res.json({ success: true, razorpayOrder: rzpOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// STEP 2 — called after Razorpay payment succeeds, with the signature to verify
async function verifyAndPlaceOrder(req, res) {
  try {
    const userId = req.user.id;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      addressId,
      customerLastName,
      phone,
    } = req.body;

    // 1. Verify payment is genuine
    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // 2. Get user, cart, address
    const [user, { cartItems, subTotal }, address] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      calculateCartTotal(userId),
      prisma.address.findUnique({ where: { id: addressId } }),
    ]);

    if (!cartItems.length) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }
    if (!address || address.userId !== userId) {
      return res.status(400).json({ success: false, message: "Invalid address" });
    }

    // 2b. Compute real per-item selling price using live gold/silver pricing
    const orderItemsData = [];
    for (const item of cartItems) {
      const pricing = await computeProductPricing(item.product);
      orderItemsData.push({
        productId: item.productId,
        name: item.product.name,
        sku: item.product.sku,
        qty: item.qty,
        sellingPrice: pricing.total,
      });
    }

    // 3. Create Order in DB — payment already confirmed at this point.
    // Shiprocket is NOT called here — admin will assign box dimensions/weight
    // and push to Shiprocket from the admin panel once the order is packed.
    const order = await prisma.order.create({
      data: {
        userId,
        customerName: user.name,
        customerLastName: customerLastName || "NA",
        customerEmail: user.email,
        customerPhone: phone || user.phone || "",
        address: address.addressLine,
        city: address.city,
        state: address.state || "Andhra Pradesh", // see note below
        pincode: address.pincode,
        subTotal,
        total: subTotal,
        paymentMethod: "Prepaid",
        paymentStatus: "Paid",
        status: "Placed",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        items: {
          create: orderItemsData,
        },
      },
      include: { items: true },
    });

    // 4. Clear cart
    await prisma.cart.deleteMany({ where: { userId } });

    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET all orders for the logged-in user
async function getMyOrders(req, res) {
  try {
    const userId = req.user.id;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET single order details — tracking only applies once admin has pushed to Shiprocket
async function getOrderById(req, res) {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId }, // ensures users can't view others' orders
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // If AWB exists (admin already shipped it), fetch live tracking status
    let tracking = null;
    if (order.srAwbCode) {
      try {
        const { trackOrder } = require('../services/shiprocketService');
        tracking = await trackOrder(order.srAwbCode);
      } catch (trackErr) {
        console.error("Tracking fetch failed:", trackErr.response?.data || trackErr.message);
      }
    }

    res.json({ success: true, order, tracking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { initiatePayment, verifyAndPlaceOrder, getMyOrders, getOrderById };