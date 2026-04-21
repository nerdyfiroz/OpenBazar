import Link from 'next/link';
import { useEffect, useState } from 'react';
import MarketplaceLayout from '../../components/MarketplaceLayout';
import { useStore } from '../../components/StoreProvider';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

export default function UserDashboard() {
  const { user, token, wishlist } = useStore();
  const [stats, setStats] = useState({ totalOrders: 0 });

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/dashboard/user`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setStats({ totalOrders: data.totalOrders || 0 }))
      .catch(() => setStats({ totalOrders: 0 }));
  }, [token]);

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-7xl space-y-4 px-4 py-6 md:px-6">
        <h1 className="text-2xl font-black">My Dashboard</h1>

        <section className="grid gap-4 md:grid-cols-3">
          <Card title="Orders" value={stats.totalOrders} />
          <Card title="Wishlist" value={wishlist.length} />
          <Card title="Profile" value={user?.name || 'Guest'} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold">Wishlist</h2>
          {!wishlist.length ? (
            <p className="mt-2 text-sm text-slate-500">No wishlist items yet.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {wishlist.slice(0, 6).map((item) => (
                <li key={item._id} className="flex items-center justify-between border-b pb-2">
                  <span>{item.name}</span>
                  <Link href={`/product/${item._id}`} className="text-orange-500">View</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </MarketplaceLayout>
  );
}

function Card({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}
