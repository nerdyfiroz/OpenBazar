import Link from 'next/link';
import { useEffect, useState } from 'react';
import MarketplaceLayout from '../../components/MarketplaceLayout';
import { useStore } from '../../components/StoreProvider';
import { resolveImageSrc, FALLBACK_IMAGE } from '../../utils/resolveImageSrc';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const STATUS_COLOR = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  paid: 'bg-blue-100 text-blue-700 border-blue-200',
  confirmed: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  processing: 'bg-purple-100 text-purple-700 border-purple-200',
  shipped: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200'
};

const STATUS_LABEL = {
  pending: '🕐 Order Placed',
  paid: '💳 Payment Received',
  confirmed: '✅ Confirmed',
  processing: '📦 Processing',
  shipped: '🚚 Shipped',
  delivered: '🎉 Delivered',
  cancelled: '❌ Cancelled'
};

function TrackingProgress({ status }) {
  const currentIdx = STATUS_STEPS.indexOf(status);
  if (status === 'cancelled') {
    return (
      <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
        ❌ This order was cancelled.
      </div>
    );
  }
  return (
    <div className="mt-4">
      <div className="flex items-center">
        {STATUS_STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const active = i === currentIdx;
          return (
            <div key={step} className="flex flex-1 items-center">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all
                ${done ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-400'}
                ${active ? 'ring-2 ring-orange-300 ring-offset-1' : ''}`}>
                {done ? '✓' : i + 1}
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`h-1 flex-1 transition-all ${i < currentIdx ? 'bg-orange-400' : 'bg-slate-200'}`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        {STATUS_STEPS.map((step) => (
          <span key={step} className="text-center capitalize">{step}</span>
        ))}
      </div>
    </div>
  );
}

export default function UserOrders() {
  const { token } = useStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const cancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(orderId);
    try {
      const res = await fetch(`${API_BASE}/orders/my/${orderId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, status: 'cancelled' } : o));
      setMessage('✅ Order cancelled successfully.');
    } catch (err) {
      setMessage(err.message || 'Failed to cancel order');
    } finally {
      setCancelling(null);
    }
  };

  useEffect(() => {
    if (!token) {
      setMessage('Please login to view your orders.');
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/orders/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (Array.isArray(data?.orders) ? data.orders : []);
        setOrders(list);
        if (!list.length) setMessage('No orders yet. Start shopping!');
      })
      .catch(() => setMessage('Failed to load orders. Try again.'))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-3xl font-black">My Orders</h1>
          <Link href="/category" className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
            + Shop More
          </Link>
        </div>

        {loading && (
          <div className="flex items-center gap-2 py-10 text-center text-sm text-slate-500">
            <span className="mx-auto animate-pulse text-2xl">⏳</span>
          </div>
        )}

        {!loading && message && !orders.length && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 py-16 text-center">
            <p className="text-4xl">🛍️</p>
            <p className="mt-3 font-semibold text-slate-700">{message}</p>
            {!token && (
              <Link href="/login" className="mt-4 inline-block rounded-xl bg-orange-500 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-600">
                Login
              </Link>
            )}
            <Link href="/category" className="mt-3 inline-block rounded-xl border border-slate-300 px-6 py-2 text-sm font-semibold hover:bg-slate-100">
              Browse Products
            </Link>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const items = order.products || [];
              const subtotal = Number(order.subtotal ?? 0);
              const discount = Number(order.discountTotal ?? order.discount ?? order.appliedCoupon?.discountAmount ?? 0);
              const delivery = Number(order.deliveryCharge ?? 0);
              const total = Number(order.total ?? 0);
              const tracking = order.tracking || {};
              const isOpen = expanded === order._id;

              return (
                <article key={order._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {/* ── Header ── */}
                  <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
                    <div>
                      <p className="font-mono text-xs text-slate-400">#{String(order._id).slice(-8).toUpperCase()}</p>
                      <p className="text-sm font-semibold text-slate-700">{new Date(order.createdAt).toLocaleString('en-BD')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${STATUS_COLOR[order.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {STATUS_LABEL[order.status] || order.status}
                      </span>
                      <span className="text-lg font-black text-orange-600">৳{total.toFixed(0)}</span>
                    </div>
                  </div>

                  {/* ── Progress bar ── */}
                  <div className="px-5 pb-2">
                    <TrackingProgress status={order.status} />
                  </div>

                  {/* ── Courier tracking banner (if set) ── */}
                  {tracking.trackingId && (
                    <div className="mx-5 mb-3 flex flex-wrap items-center gap-3 rounded-xl bg-orange-50 px-4 py-3 text-sm">
                      <span className="text-xl">🚚</span>
                      <div className="flex-1">
                        <p className="font-semibold text-orange-700">{tracking.courierService || 'Courier'} — Parcel ID: <span className="font-mono">{tracking.trackingId}</span></p>
                        {tracking.trackingUrl && (
                          <a href={tracking.trackingUrl} target="_blank" rel="noreferrer" className="text-xs text-orange-600 underline hover:text-orange-800">
                            Track on courier website →
                          </a>
                        )}
                      </div>
                      {tracking.trackingUrl && (
                        <a href={tracking.trackingUrl} target="_blank" rel="noreferrer"
                          className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-600">
                          Track Now
                        </a>
                      )}
                    </div>
                  )}

                  {/* ── Toggle details ── */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : order._id)}
                    className="flex w-full items-center justify-between px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <span>{items.length} item{items.length !== 1 ? 's' : ''} · {order.paymentMethod}</span>
                    <span className="text-orange-500">{isOpen ? '▲ Hide details' : '▼ View details'}</span>
                  </button>

                  {/* ── Expanded details ── */}
                  {isOpen && (
                    <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                      {/* Item list */}
                      <ul className="space-y-3">
                        {items.map((item, i) => {
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
                                <p className="text-sm font-semibold">{name}</p>
                                <p className="text-xs text-slate-500">Qty: {qty}</p>
                              </div>
                              <p className="font-bold">৳{(price * qty).toFixed(0)}</p>
                            </li>
                          );
                        })}
                      </ul>

                      {/* Price breakdown */}
                      <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm">
                        <div className="flex justify-between text-slate-500">
                          <span>Subtotal</span><span>৳{subtotal.toFixed(0)}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Coupon {order.appliedCoupon?.code ? `(${order.appliedCoupon.code})` : 'Discount'}</span>
                            <span>-৳{discount.toFixed(0)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-500">
                          <span>Delivery</span>
                          <span>{delivery === 0 ? '🎁 Free' : `৳${delivery.toFixed(0)}`}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-2 font-black text-slate-800">
                          <span>Total</span><span>৳{total.toFixed(0)}</span>
                        </div>
                      </div>

                      {/* Shipping & payment */}
                      <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                        {order.shippingAddress?.fullAddress && (
                          <div className="rounded-lg bg-slate-50 p-2">
                            <p className="font-semibold text-slate-600">📍 Shipping Address</p>
                            <p>{order.shippingAddress.fullAddress}</p>
                            {order.shippingAddress.upazila && <p>{order.shippingAddress.upazila}, {order.shippingAddress.district}</p>}
                          </div>
                        )}
                        <div className="rounded-lg bg-slate-50 p-2">
                          <p className="font-semibold text-slate-600">💳 Payment</p>
                          <p>{order.paymentMethod}</p>
                          {order.paymentInfo?.transactionId && <p className="font-mono">TX: {order.paymentInfo.transactionId}</p>}
                        </div>
                      </div>

                      {/* Invoice */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <a href={`${API_BASE.replace('/api', '')}/api/invoice/${order._id}`}
                          target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-orange-300 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50">
                          📄 Invoice
                        </a>
                        <Link href={`/track/${order._id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                          🔍 Track Order
                        </Link>
                        {['pending', 'confirmed'].includes(order.status) && (
                          <button
                            onClick={() => cancelOrder(order._id)}
                            disabled={cancelling === order._id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
                            {cancelling === order._id ? '⏳ Cancelling...' : '❌ Cancel Order'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </MarketplaceLayout>
  );
}
