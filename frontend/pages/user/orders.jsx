import Link from 'next/link';
import { useEffect, useState } from 'react';
import MarketplaceLayout from '../../components/MarketplaceLayout';
import { useStore } from '../../components/StoreProvider';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

export default function UserOrders() {
  const { token } = useStore();
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setMessage('Please login to view orders.');
      return;
    }

    fetch(`${API_BASE}/orders/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setMessage('Failed to load orders'));
  }, [token]);

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <h1 className="mb-4 text-2xl font-black">My Orders</h1>
        {message && <p className="mb-3 rounded-lg bg-slate-100 px-3 py-2 text-sm">{message}</p>}

        <div className="space-y-3">
          {orders.map((order) => (
            <article key={order._id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">Order #{order._id.slice(-6).toUpperCase()}</p>
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">{order.status}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">Total: ৳{Number(order.total || 0).toFixed(2)}</p>
              <p className="text-sm text-slate-500">Payment: {order.paymentMethod}</p>
              <Link href={`${API_BASE.replace('/api', '')}/api/invoice/${order._id}`} target="_blank" className="mt-3 inline-block text-sm font-semibold text-orange-500">
                Download Invoice
              </Link>
            </article>
          ))}
        </div>
      </main>
    </MarketplaceLayout>
  );
}
