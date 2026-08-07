// createOrder.js
const axios = require('axios');
const { getShiprocketToken } = require('./shiprocketAuth');

async function createShiprocketOrder(orderData) {
  const token = await getShiprocketToken();

  const payload = {
    order_id: orderData.orderId,          // your internal order id, must be unique
    order_date: orderData.orderDate,      // "YYYY-MM-DD HH:mm"
    pickup_location: "Primary",           // must match a pickup address configured in Shiprocket panel
    billing_customer_name: orderData.customerName,
    billing_address: orderData.address,
    billing_city: orderData.city,
    billing_pincode: orderData.pincode,
    billing_state: orderData.state,
    billing_country: "India",
    billing_email: orderData.email,
    billing_phone: orderData.phone,
    shipping_is_billing: true,
    order_items: orderData.items.map(item => ({
      name: item.name,
      sku: item.sku,
      units: item.qty,
      selling_price: item.price,
    })),
    payment_method: orderData.paymentMethod, // "Prepaid" or "COD"
    sub_total: orderData.subTotal,
    length: orderData.length,
    breadth: orderData.breadth,
    height: orderData.height,
    weight: orderData.weight, // in kg
  };

  const res = await axios.post(
    'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return res.data; // contains order_id, shipment_id
}