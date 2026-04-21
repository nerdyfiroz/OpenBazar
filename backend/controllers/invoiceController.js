// Invoice Controller: Generate simple HTML invoice
// Upgrade: Add PDF generation, email invoice, branding, etc.
const Order = require('../models/Order');
const User = require('../models/User');

exports.getInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('products.product');
    if (!order) return res.status(404).send('Order not found');
    // Only allow user or seller or admin
    if (
      req.user.role === 'user' && String(order.user) !== String(req.user._id) &&
      req.user.role !== 'admin' &&
      !order.products.some(p => String(p.seller) === String(req.user._id))
    ) {
      return res.status(403).send('Forbidden');
    }
    // Get seller name (for multi-vendor, show all sellers)
    const sellers = await User.find({ _id: { $in: order.products.map(p => p.seller) } });
    // Simple HTML invoice (upgrade: PDF)
    let html = `<html><head><title>Invoice</title></head><body>`;
    html += `<h1>Invoice #${order._id}</h1>`;
    html += `<p>Date: ${order.createdAt.toLocaleString()}</p>`;
    html += `<h2>Products</h2><ul>`;
    order.products.forEach(p => {
      const seller = sellers.find(s => String(s._id) === String(p.seller));
      html += `<li>${p.product.name} x${p.quantity} - ৳${p.price} (Seller: ${seller?.name || 'N/A'})</li>`;
    });
    html += `</ul>`;
    html += `<p>Total: <b>৳${order.total}</b></p>`;
    html += `<p>Commission: <b>৳${order.commission || 0}</b></p>`;
    html += `</body></html>`;
    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).send('Server error');
  }
};
