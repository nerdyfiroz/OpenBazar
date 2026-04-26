import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import MarketplaceLayout from '../../components/MarketplaceLayout';
import { resolveImageSrc, FALLBACK_IMAGE } from '../../utils/resolveImageSrc';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const STATUS_COLOR = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700'
};

const STATUS_INFO = {
  pending: { icon: '🕐', label: 'Order Placed', desc: 'Your order has been placed and is waiting for confirmation.' },
  paid: { icon: '💳', label: 'Payment Received', desc: 'Payment has been verified.' },
  confirmed: { icon: '✅', label: 'Confirmed', desc: 'Seller has confirmed your order and is preparing it.' },
  processing: { icon: '📦', label: 'Processing', desc: 'Your order is being packed and prepared for shipment.' },
  shipped: { icon: '🚚', label: 'Shipped', desc: 'Your parcel is on its way! Check courier tracking below.' },
  delivered: { icon: '🎉', label: 'Delivered', desc: 'Your order has been delivered. Enjoy your purchase!' },
  cancelled: { icon: '❌', label: 'Cancelled', desc: 'This order has been cancelled.' }
};

function ProgressBar({ status }) {
  const currentIdx = STATUS_STEPS.indexOf(status);
  if (status === 'cancelled') return null;
  return (
    <div className="mt-6">
      <div className="flex items-center">
        {STATUS_STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          const info = STATUS_INFO[step] || {};
          return (
            <div key={step} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold shadow transition-all
                  ${done ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-400'}
                  ${active ? 'ring-4 ring-orange-200' : ''}`}>
                  {done ? info.icon || '✓' : i + 1}
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`h-1.5 flex-1 rounded-full transition-all ${i < currentIdx ? 'bg-orange-400' : 'bg-slate-200'}`} />
                )}
              </div>
              <p className={`mt-1.5 text-center text-[10px] font-semibold capitalize ${done ? 'text-orange-600' : 'text-slate-400'}`}>
                {step}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TrackOrder() {
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

  const statusInfo = STATUS_INFO[order?.status] || STATUS_INFO.pending;
  const tracking = order?.tracking || {};

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-4">
          <Link href="/user/orders" className="text-sm text-orange-500 hover:underline">← Back to My Orders</Link>
        </div>

        <h1 className="text-3xl font-black">Track Order</h1>

        {loading && <p className="mt-8 text-center text-slate-500 animate-pulse">Loading tracking info...</p>}

        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
            <p className="text-3xl">❌</p>
            <p className="mt-2 font-semibold">{error}</p>
            <p className="mt-1 text-sm text-slate-500">Make sure the order ID is correct.</p>
          </div>
        )}

        {order && (
          <div className="mt-4 space-y-4">
            {/* Status card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-slate-400">Order #{String(order._id).slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString('en-BD')}</p>
                </div>
                <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${STATUS_COLOR[order.status] || 'bg-slate-100 text-slate-600'}`}>
                  {statusInfo.icon} {statusInfo.label}
                </span>
              </div>

              <ProgressBar status={order.status} />

              <p className="mt-4 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-700">
                {statusInfo.desc}
              </p>
            </div>

            {/* Courier tracking */}
            {tracking.trackingId ? (
              <div className="rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-5 shadow-sm">
                <h2 className="mb-3 text-lg font-bold">🚚 Courier Tracking</h2>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Courier Service</p>
                    <p className="mt-0.5 text-base font-bold">{tracking.courierService || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">Parcel / Waybill ID</p>
                    <p className="mt-0.5 font-mono text-base font-bold text-orange-700">{tracking.trackingId}</p>
                  </div>
                </div>
                {tracking.trackingUrl && (
                  <a href={tracking.trackingUrl} target="_blank" rel="noreferrer"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600">
                    🔍 Track on Courier Website
                  </a>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
                <p className="text-2xl">📦</p>
                <p className="mt-1">Courier tracking info will appear here once your order is shipped.</p>
              </div>
            )}

            {/* Order details */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-bold">Order Details</h2>
              <ul className="space-y-3">
                {(order.products || []).map((item, i) => {
                  const prod = item.product || {};
                  const name = item.name || prod.name || 'Product';
                  const qty = Number(item.quantity || 1);
                  const price = Number(item.price || 0);
                  const img = resolveImageSrc(prod.images?.[0] || prod.photos?.[0]);
                  return (
                    <li key={i} className="flex items-center gap-3">
                      <img src={img} alt={name} className="h-14 w-14 rounded-lg object-cover"
                        onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }} />
                      <div className="flex-1">
                        <p className="font-semibold">{name}</p>
                        <p className="text-xs text-slate-500">× {qty}</p>
                      </div>
                      <p className="font-bold">৳{(price * qty).toFixed(0)}</p>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm">
                <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>৳{Number(order.subtotal || 0).toFixed(0)}</span></div>
                {Number(order.discountTotal || 0) > 0 && (
                  <div className="flex justify-between text-green-600"><span>Discount</span><span>-৳{Number(order.discountTotal).toFixed(0)}</span></div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Delivery</span>
                  <span>{Number(order.deliveryCharge || 0) === 0 ? '🎁 Free' : `৳${Number(order.deliveryCharge).toFixed(0)}`}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 font-black"><span>Total</span><span>৳{Number(order.total || 0).toFixed(0)}</span></div>
              </div>

              {order.shippingAddress?.fullAddress && (
                <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
                  <p className="font-semibold text-slate-600">📍 Shipping To</p>
                  <p className="text-slate-600">{order.shippingAddress.fullAddress}</p>
                  {order.shippingAddress.upazila && (
                    <p className="text-slate-500">{order.shippingAddress.upazila}, {order.shippingAddress.district}, {order.shippingAddress.division}</p>
                  )}
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <a href={`${API_BASE.replace('/api', '')}/api/invoice/${order._id}`}
                  target="_blank" rel="noreferrer"
                  className="rounded-lg border border-orange-300 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50">
                  📄 Download Invoice
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </MarketplaceLayout>
  );
}
