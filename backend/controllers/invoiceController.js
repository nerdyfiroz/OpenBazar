// Invoice Controller: Premium HTML/PDF-ready multi-vendor invoice generator
const Order = require('../models/Order');
const User = require('../models/User');

exports.getInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('products.product')
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Invoice Not Found — OpenBazar</title></head>
          <body style="font-family:sans-serif; text-align:center; padding:50px;">
            <h2>Invoice Not Found</h2>
            <p>Could not locate the requested order invoice.</p>
          </body>
        </html>
      `);
    }

    // Permission check if authenticated
    if (req.user) {
      const isBuyer = order.user && String(order.user._id || order.user) === String(req.user._id);
      const isAdmin = req.user.role === 'admin';
      const isSeller = order.products.some(p => String(p.seller) === String(req.user._id));

      if (!isBuyer && !isAdmin && !isSeller) {
        return res.status(403).send(`
          <!DOCTYPE html>
          <html>
            <head><title>Access Denied — OpenBazar</title></head>
            <body style="font-family:sans-serif; text-align:center; padding:50px;">
              <h2>Access Denied</h2>
              <p>You do not have permission to view this invoice.</p>
            </body>
          </html>
        `);
      }
    }

    // Fetch sellers info
    const sellerIds = [...new Set(order.products.map(p => p.seller).filter(Boolean))];
    const sellers = await User.find({ _id: { $in: sellerIds } }).select('name sellerApplication');

    // Customer details
    const customerName = order.paymentInfo?.customerName || order.guestCustomer?.name || order.user?.name || order.shippingAddress?.fullName || 'Valued Customer';
    const customerPhone = order.paymentInfo?.phone || order.guestCustomer?.phone || order.user?.phone || order.shippingAddress?.phone || 'N/A';
    const customerEmail = order.guestCustomer?.email || order.user?.email || 'N/A';
    const address = order.shippingAddress?.fullAddress || 'Address on file';
    const location = [order.shippingAddress?.upazila, order.shippingAddress?.district, order.shippingAddress?.division].filter(Boolean).join(', ');

    const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const invoiceNumber = `INV-${order.orderNumber || order._id.toString().toUpperCase().slice(-8)}`;
    const paymentMethod = (order.paymentInfo?.method || order.paymentMethod || 'Cash on Delivery').toUpperCase();
    const isPaid = order.paymentInfo?.status === 'completed' || order.status === 'paid' || order.isPaid;
    const paymentStatus = isPaid ? 'PAID' : (paymentMethod === 'COD' || paymentMethod.includes('CASH') ? 'COD (PAY ON RECEIPT)' : 'PAYMENT PENDING');

    const subtotal = Number(order.subtotal || order.itemsPrice || 0);
    const discount = Number(order.discountTotal || order.couponDiscount || 0);
    const delivery = Number(order.deliveryCharge || order.shippingPrice || 0);
    const total = Number(order.total || order.totalPrice || 0);

    const productsHtml = order.products.map((item, idx) => {
      const prod = item.product || {};
      const name = item.name || prod.name || 'Marketplace Item';
      const qty = Number(item.quantity || 1);
      const price = Number(item.price || item.unitPrice || 0);
      const lineTotal = price * qty;

      const sellerObj = sellers.find(s => String(s._id) === String(item.seller));
      const storeName = sellerObj?.sellerApplication?.storeName || sellerObj?.name || 'Verified Merchant';

      const specs = [
        item.selectedWeight && `Weight: ${item.selectedWeight}`,
        item.selectedColor && `Color: ${item.selectedColor}`,
        item.selectedSize && `Size: ${item.selectedSize}`
      ].filter(Boolean).join(' · ');

      return `
        <tr>
          <td style="padding: 12px 14px; border-bottom: 1px solid #f1f5f9; text-align: center; color: #64748b; font-weight: 700; font-size: 12px;">
            ${idx + 1}
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid #f1f5f9;">
            <div style="font-weight: 800; font-size: 13px; color: #0f172a;">${name}</div>
            ${specs ? `<div style="font-size: 11px; color: #6366f1; font-weight: 600; margin-top: 2px;">${specs}</div>` : ''}
            <div style="font-size: 10.5px; color: #94a3b8; margin-top: 1px;">Store: ${storeName}</div>
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700; font-size: 13px; color: #1e293b;">
            ৳${price.toFixed(2)}
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid #f1f5f9; text-align: center; font-weight: 800; font-size: 13px; color: #0f172a;">
            ${qty}
          </td>
          <td style="padding: 12px 14px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 900; font-size: 13px; color: #0f172a;">
            ৳${lineTotal.toFixed(2)}
          </td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${invoiceNumber} — OpenBazar</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            color: #0f172a;
            line-height: 1.5;
            padding: 30px 15px;
          }
          .action-bar {
            max-width: 820px;
            margin: 0 auto 20px auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 800;
            text-decoration: none;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
          }
          .btn-print {
            background: linear-gradient(135deg, #2563eb, #4f46e5);
            color: #ffffff;
            box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
          }
          .btn-print:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
          }
          .btn-back {
            background: #ffffff;
            color: #475569;
            border: 1px solid #cbd5e1;
          }
          .invoice-card {
            max-width: 820px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 24px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0,0,0,0.05);
            border: 1px solid #e2e8f0;
            padding: 44px;
            position: relative;
          }
          .header-grid {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 28px;
            margin-bottom: 28px;
          }
          .brand-title {
            font-size: 26px;
            font-weight: 900;
            color: #4f46e5;
            letter-spacing: -0.5px;
          }
          .badge-paid {
            display: inline-block;
            background: #ecfdf5;
            color: #059669;
            border: 1px solid #a7f3d0;
            padding: 4px 14px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .badge-pending {
            display: inline-block;
            background: #fffbeb;
            color: #d97706;
            border: 1px solid #fde68a;
            padding: 4px 14px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 16px;
            margin-bottom: 28px;
            border: 1px solid #edf2f7;
          }
          .table-container {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          .table-container th {
            background: #f1f5f9;
            padding: 10px 14px;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            color: #475569;
            letter-spacing: 0.5px;
          }
          .stamp {
            border: 2px dashed #059669;
            color: #059669;
            padding: 8px 14px;
            display: inline-block;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 1px;
            text-transform: uppercase;
            transform: rotate(-3deg);
          }
          @media print {
            body { background: #ffffff; padding: 0; }
            .action-bar { display: none !important; }
            .invoice-card {
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
              max-width: 100% !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="action-bar">
          <button onclick="window.history.back()" class="btn btn-back">← Back</button>
          <div style="display: flex; gap: 10px;">
            <button onclick="window.print()" class="btn btn-print">🖨️ Print / Save as PDF</button>
          </div>
        </div>

        <div class="invoice-card">
          <!-- Top Header -->
          <div class="header-grid">
            <div>
              <div class="brand-title">🛍️ OpenBazar</div>
              <p style="font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 500;">
                Bangladesh-First Online Marketplace<br>
                Dhaka, Bangladesh · support@open-bazar.me
              </p>
            </div>
            <div style="text-align: right;">
              <h2 style="font-size: 20px; font-weight: 900; color: #0f172a;">TAX INVOICE</h2>
              <p style="font-size: 13px; font-weight: 800; color: #4f46e5; margin-top: 2px;">${invoiceNumber}</p>
              <div style="margin-top: 6px;">
                <span class="${isPaid ? 'badge-paid' : 'badge-pending'}">${paymentStatus}</span>
              </div>
            </div>
          </div>

          <!-- Metadata info boxes -->
          <div class="meta-grid">
            <div>
              <p style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #6366f1; letter-spacing: 0.5px; margin-bottom: 4px;">CUSTOMER & SHIPPING DETAILS</p>
              <h4 style="font-size: 14px; font-weight: 800; color: #0f172a;">${customerName}</h4>
              <p style="font-size: 12px; color: #475569; margin-top: 2px;">📞 ${customerPhone}</p>
              ${customerEmail !== 'N/A' ? `<p style="font-size: 12px; color: #475569;">✉️ ${customerEmail}</p>` : ''}
              <p style="font-size: 12px; color: #64748b; margin-top: 4px; line-height: 1.4;">
                📍 ${address}${location ? `<br>${location}` : ''}
              </p>
            </div>
            <div>
              <p style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #6366f1; letter-spacing: 0.5px; margin-bottom: 4px;">ORDER SUMMARY</p>
              <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 2px 0; color: #64748b;">Order Ref:</td>
                  <td style="padding: 2px 0; font-weight: 800; text-align: right; color: #0f172a;">#${order._id.toString().toUpperCase().slice(-8)}</td>
                </tr>
                <tr>
                  <td style="padding: 2px 0; color: #64748b;">Order Date:</td>
                  <td style="padding: 2px 0; font-weight: 700; text-align: right; color: #0f172a;">${orderDate}</td>
                </tr>
                <tr>
                  <td style="padding: 2px 0; color: #64748b;">Payment Mode:</td>
                  <td style="padding: 2px 0; font-weight: 800; text-align: right; color: #4f46e5;">${paymentMethod}</td>
                </tr>
                <tr>
                  <td style="padding: 2px 0; color: #64748b;">Order Status:</td>
                  <td style="padding: 2px 0; font-weight: 700; text-align: right; text-transform: uppercase; color: #0f172a;">${order.status}</td>
                </tr>
                ${order.tracking?.trackingId ? `
                  <tr>
                    <td style="padding: 2px 0; color: #64748b;">Courier Waybill:</td>
                    <td style="padding: 2px 0; font-weight: 800; text-align: right; color: #059669;">${order.tracking.trackingId}</td>
                  </tr>
                ` : ''}
              </table>
            </div>
          </div>

          <!-- Item Table -->
          <table class="table-container">
            <thead>
              <tr>
                <th style="border-top-left-radius: 10px; width: 40px; text-align: center;">#</th>
                <th style="text-align: left;">Item Description & Store</th>
                <th style="text-align: right; width: 110px;">Unit Price</th>
                <th style="text-align: center; width: 60px;">Qty</th>
                <th style="border-top-right-radius: 10px; text-align: right; width: 120px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${productsHtml}
            </tbody>
          </table>

          <!-- Financial Breakdown -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 10px; padding-top: 10px;">
            <div style="max-width: 320px;">
              <div class="stamp">✓ OFFICIAL INVOICE VALIDATED</div>
              <p style="font-size: 11px; color: #94a3b8; margin-top: 10px; line-height: 1.4;">
                Thank you for shopping with OpenBazar! For returns or claims, please preserve this invoice receipt.
              </p>
            </div>

            <div style="width: 280px; background: #f8fafc; border-radius: 16px; padding: 16px; border: 1px solid #edf2f7;">
              <div style="display: flex; justify-content: space-between; font-size: 12px; color: #64748b; margin-bottom: 6px;">
                <span>Subtotal</span>
                <span style="font-weight: 700; color: #1e293b;">৳${subtotal.toFixed(2)}</span>
              </div>

              ${discount > 0 ? `
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #059669; font-weight: 700; margin-bottom: 6px;">
                  <span>Coupon Discount</span>
                  <span>−৳${discount.toFixed(2)}</span>
                </div>
              ` : ''}

              <div style="display: flex; justify-content: space-between; font-size: 12px; color: #64748b; margin-bottom: 8px;">
                <span>Delivery Charge</span>
                <span style="font-weight: 700; color: #1e293b;">${delivery === 0 ? 'FREE' : `৳${delivery.toFixed(2)}`}</span>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; color: #0f172a; border-top: 2px solid #e2e8f0; padding-top: 10px;">
                <span>Total Due</span>
                <span style="color: #4f46e5;">৳${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <!-- Bottom Footer -->
          <div style="margin-top: 36px; padding-top: 20px; border-top: 1px dashed #cbd5e1; text-align: center; font-size: 11px; color: #94a3b8;">
            <p>OpenBazar E-Commerce Marketplace · BIN: 004819201-0102 · Dhaka, Bangladesh</p>
            <p style="margin-top: 2px;">This is a computer-generated invoice and does not require a physical signature.</p>
          </div>
        </div>

        <script>
          if (new URLSearchParams(window.location.search).get('print') === 'true') {
            window.onload = function() {
              window.print();
            };
          }
        </script>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error('Invoice error:', err);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Invoice Error</title></head>
        <body style="font-family:sans-serif; text-align:center; padding:50px;">
          <h2>Unable to generate invoice</h2>
          <p>Please try again or contact OpenBazar customer support.</p>
        </body>
      </html>
    `);
  }
};
