import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import SEO from '../../components/SEO';
import { getApiBase } from '../../utils/apiBase';

const API_BASE = getApiBase();

export default function InvoicePage() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE}/orders/track/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.message && !data._id) throw new Error(data.message);
        setOrder(data);
      })
      .catch((e) => setError(e.message || 'Order not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-500 font-semibold">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Generating Official Invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-lg">
          <span className="text-4xl mb-3 block">❌</span>
          <h1 className="text-lg font-black text-slate-900 mb-2">Invoice Not Found</h1>
          <p className="text-xs text-slate-500 mb-6">{error || 'Could not locate order details.'}</p>
          <Link href="/" className="rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-white">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const invoiceNumber = `INV-${order.orderNumber || String(order._id).toUpperCase().slice(-8)}`;
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const customerName = order.paymentInfo?.customerName || order.guestCustomer?.name || order.user?.name || order.shippingAddress?.fullName || 'Valued Customer';
  const customerPhone = order.paymentInfo?.phone || order.guestCustomer?.phone || order.user?.phone || order.shippingAddress?.phone || 'N/A';
  const customerEmail = order.guestCustomer?.email || order.user?.email || 'N/A';
  const address = order.shippingAddress?.fullAddress || 'Address on file';
  const location = [order.shippingAddress?.upazila, order.shippingAddress?.district, order.shippingAddress?.division].filter(Boolean).join(', ');

  const paymentMethod = (order.paymentInfo?.method || order.paymentMethod || 'Cash on Delivery').toUpperCase();
  const isPaid = order.paymentInfo?.status === 'completed' || order.status === 'paid' || order.isPaid;
  const paymentStatus = isPaid ? 'PAID' : (paymentMethod === 'COD' || paymentMethod.includes('CASH') ? 'COD (PAY ON DELIVERY)' : 'PENDING');

  const subtotal = Number(order.subtotal || order.itemsPrice || 0);
  const discount = Number(order.discountTotal || order.couponDiscount || 0);
  const delivery = Number(order.deliveryCharge || order.shippingPrice || 0);
  const total = Number(order.total || order.totalPrice || 0);

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 print:bg-white print:p-0">
      <SEO title={`Invoice ${invoiceNumber} — OpenBazar`} description="Tax Invoice Receipt" canonical={`/invoice/${id}`} noindex />

      {/* Floating Action Header (Hidden on Print) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition shadow-xs"
        >
          ← Back
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-500/25 hover:shadow-lg hover:scale-105 active:scale-95 transition"
          >
            <span>🖨️</span>
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* ── Main Printable Invoice Card ── */}
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 sm:p-12 print:shadow-none print:border-none print:p-0">
        
        {/* Top Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-100 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛍️</span>
              <span className="text-2xl font-black tracking-tight text-indigo-600">OpenBazar</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
              Bangladesh-First E-Commerce Marketplace<br />
              Dhaka, Bangladesh · support@open-bazar.me
            </p>
          </div>

          <div className="text-right">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">TAX INVOICE</h2>
            <p className="text-xs font-extrabold text-indigo-600 font-mono mt-0.5">{invoiceNumber}</p>
            <div className="mt-2">
              <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Order Metadata Grid */}
        <div className="grid sm:grid-cols-2 gap-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-100 mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 mb-1.5">BILLED & SHIPPED TO</p>
            <h4 className="text-sm font-black text-slate-900">{customerName}</h4>
            <p className="text-xs text-slate-600 font-semibold mt-1">📞 {customerPhone}</p>
            {customerEmail !== 'N/A' && <p className="text-xs text-slate-500 mt-0.5">✉️ {customerEmail}</p>}
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              📍 {address}
              {location && <><br />{location}</>}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 mb-1.5">ORDER PARTICULARS</p>
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Order Reference:</span>
                <span className="font-mono font-bold text-slate-900">#{String(order._id).toUpperCase().slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span className="font-semibold text-slate-800">{orderDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-bold text-indigo-600">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Fulfillment Status:</span>
                <span className="font-bold uppercase text-slate-900">{order.status}</span>
              </div>
              {order.tracking?.trackingId && (
                <div className="flex justify-between pt-1 border-t border-slate-200 text-emerald-700 font-bold">
                  <span>Courier Waybill:</span>
                  <span>{order.tracking.trackingId}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Itemized Products Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-black uppercase tracking-wider text-[10px]">
                <th className="p-3 rounded-l-xl text-center w-10">#</th>
                <th className="p-3">Item Description</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3 text-center w-14">Qty</th>
                <th className="p-3 rounded-r-xl text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(order.products || []).map((item, idx) => {
                const prod = item.product || {};
                const name = item.name || prod.name || 'Marketplace Item';
                const qty = Number(item.quantity || 1);
                const price = Number(item.price || item.unitPrice || 0);
                const lineTotal = price * qty;

                const specs = [
                  item.selectedWeight && `Weight: ${item.selectedWeight}`,
                  item.selectedColor && `Color: ${item.selectedColor}`,
                  item.selectedSize && `Size: ${item.selectedSize}`
                ].filter(Boolean).join(' · ');

                return (
                  <tr key={idx}>
                    <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-extrabold text-slate-900">{name}</div>
                      {specs && <div className="text-[11px] font-semibold text-indigo-600 mt-0.5">{specs}</div>}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-700">৳{price.toFixed(2)}</td>
                    <td className="p-3 text-center font-black text-slate-900">{qty}</td>
                    <td className="p-3 text-right font-black text-slate-900">৳{lineTotal.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & Stamp */}
        <div className="flex flex-wrap items-start justify-between gap-6 pt-2">
          <div className="max-w-xs">
            <div className="inline-block border-2 border-dashed border-emerald-500 px-3 py-1.5 rounded-lg text-emerald-600 font-black text-[11px] uppercase tracking-wider -rotate-2">
              ✓ OFFICIAL INVOICE VALIDATED
            </div>
            <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
              Thank you for trusting OpenBazar! For any claims or assistance, retain this invoice for verified support.
            </p>
          </div>

          <div className="w-72 bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-bold text-slate-800">৳{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Coupon Discount</span>
                <span>−৳{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Delivery Charge</span>
              <span className="font-bold text-slate-800">{delivery === 0 ? 'FREE' : `৳${delivery.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 border-t-2 border-slate-200 pt-2">
              <span>Grand Total</span>
              <span className="text-indigo-600 text-base">৳{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-dashed border-slate-200 text-center text-[10px] text-slate-400">
          <p>OpenBazar E-Commerce Marketplace · BIN: 004819201-0102 · Dhaka, Bangladesh</p>
          <p className="mt-0.5">This is an authentic computer-generated invoice from OpenBazar.</p>
        </div>

      </div>
    </div>
  );
}
