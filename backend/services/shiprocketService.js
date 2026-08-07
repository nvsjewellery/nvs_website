const axios = require('axios');
const { getShiprocketToken } = require('./shiprocketAuth');

const SR_BASE = 'https://apiv2.shiprocket.in/v1/external';

async function srRequest(method, path, data = null) {
  const token = await getShiprocketToken();
  const res = await axios({
    method,
    url: `${SR_BASE}${path}`,
    data,
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

function createOrder(payload) {
  return srRequest('post', '/orders/create/adhoc', payload);
}

function assignAwb(shipmentId) {
  return srRequest('post', '/courier/assign/awb', { shipment_id: shipmentId });
}

function trackOrder(awbCode) {
  return srRequest('get', `/courier/track/awb/${awbCode}`);
}

function getOrderDetails(shiprocketOrderId) {
  return srRequest('get', `/orders/show/${shiprocketOrderId}`);
}

function checkServiceability(pickupPincode, deliveryPincode, weight, cod) {
  return srRequest('get', `/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=${weight}&cod=${cod ? 1 : 0}`);
}

function generatePickup(shipmentId) {
  return srRequest('post', '/courier/generate/pickup', { shipment_id: [shipmentId] });
}

function generateManifest(shipmentId) {
  return srRequest('post', '/manifests/generate', { shipment_id: [shipmentId] });
}

function printManifest(orderIds) {
  return srRequest('post', '/manifests/print', { order_ids: orderIds });
}

function generateLabel(shipmentId) {
  return srRequest('post', '/courier/generate/label', { shipment_id: [shipmentId] });
}

function printInvoice(orderIds) {
  return srRequest('post', '/orders/print/invoice', { ids: orderIds });
}

function cancelOrder(orderIds) {
  return srRequest('post', '/orders/cancel', { ids: orderIds });
}


module.exports = {
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
};