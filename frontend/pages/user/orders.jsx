import Link from 'next/link';
import { useEffect, useState } from 'react';
import MarketplaceLayout from '../../components/MarketplaceLayout';
import { useStore } from '../../components/StoreProvider';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

const STATUS_COLOR = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700'
};

export default function UserOrders() {
  const { token } = useStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setMessage('Please login to view your orders.');
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/orders/my`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        // Backend returns { orders, total, ... } or a plain array
        const list = Array.isArray(data) ? data : (Array.isArray(data?.orders) ? data.orders : []);
        setOrders(list);
        if (list.length === 0) setMessage('You have no orders yet.');
      })
      .catch(() => setMessage('Failed to load orders. Please try again.'))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-black">My Orders</h1>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="animate-spin">⏳</span> Loading orders...
          </div>
        )}

        {!loading && message && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
            {message}
            {!token && (
              <div className="mt-3">
                <Link href="/login" className="rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600">
                  Login
                </Link>
              </div>
            )}
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const items = order.products || [];
              const subtotal = Number(order.subtotal ?? order.total ?? 0);
              const discount = Number(order.discount || 0);
              const delivery = Number(order.deliveryCharge ?? order.deliveryFee ?? 0);
              const total = Number(order.total ?? (subtotal - discount + delivery));

              return (
                <article key={order._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  {/* Header row */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-slate-400">Order ID: {order._id}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLOR[order.status] || 'bg-slate-100 text-slate-600'}`}>
                      {order.status?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>

                  {/* Products */}
                  {items.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {items.map((item, i) => {
                        const name = item.name || item.product?.name || 'Product';
                        const qty = Number(item.quantity || 1);
                        const price = Number(item.price || 0);
                        return (
                          <li key={i} className="flex items-center justify-between gap-2 text-sm">
                            <span className="text-slate-700">{name} <span className="text-slate-400">× {qty}</span></span>
                            <span className="font-semibold">৳{(price * qty).toFixed(0)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* Price summary */}
                  <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm">
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Coupon Discount</span>
                        <span>-৳{discount.toFixed(0)}</span>
                      </div>
                    )}
                    {delivery >= 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>Delivery</span>
                        <span>{delivery === 0 ? 'Free' : `৳${delivery.toFixed(0)}`}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>Total</span>
                      <span>৳{total.toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Payment & shipping info */}
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                    <span>💳 {order.paymentMethod || 'N/A'}</span>
                    {order.shippingAddress?.fullAddress && (
                      <span>📍 {order.shippingAddress.fullAddress}</span>
                    )}
                  </div>

                  {/* Invoice link */}
                  <div className="mt-4">
                    <a
                      href={`${API_BASE.replace('/api', '')}/api/invoice/${order._id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-orange-300 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50"
                    >
                      📄 Download Invoice
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </MarketplaceLayout>
  );
}
