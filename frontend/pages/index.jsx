import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import MarketplaceLayout from '../components/MarketplaceLayout';
import ProductCard from '../components/ProductCard';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

const SHOP_CATEGORIES = [
  { label: 'Electronics', emoji: '📱' },
  { label: 'Fashion', emoji: '👗' },
  { label: 'Beauty', emoji: '💄' },
  { label: 'Home & Living', emoji: '🏠' },
  { label: 'Sports', emoji: '⚽' }
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [flashSale, setFlashSale] = useState({ status: 'inactive', count: 0, nextEndsAt: null });
  const [flashSaleEndsIn, setFlashSaleEndsIn] = useState('00:00:00');

  useEffect(() => {
    fetch(`${API_BASE}/dashboard/visit`, { method: 'POST' }).catch(() => {});

    fetch(`${API_BASE}/products?limit=24`)
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data.products) ? data.products : (Array.isArray(data) ? data : [])))
      .catch(() => setProducts([]));

    fetch(`${API_BASE}/dashboard/flash-sale`)
      .then((res) => res.json())
      .then((data) => setFlashSale({
        status: data?.status || 'inactive',
        count: Number(data?.count || 0),
        nextEndsAt: data?.nextEndsAt || null
      }))
      .catch(() => setFlashSale({ status: 'inactive', count: 0, nextEndsAt: null }));
  }, []);

  useEffect(() => {
    const updateTimer = () => {
      if (!flashSale.nextEndsAt) {
        setFlashSaleEndsIn('00:00:00');
        return;
      }

      const now = new Date();
      const end = new Date(flashSale.nextEndsAt);
      const diff = Math.max(0, end.getTime() - now.getTime());
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setFlashSaleEndsIn(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [flashSale.nextEndsAt]);

  const featured = products.slice(0, 8);
  const trending = products.slice(8, 16);

  return (
    <MarketplaceLayout>
      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-6 md:grid-cols-3 md:px-6">
        <div className="rounded-3xl bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-white md:col-span-2">
          <p className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">Mega Campaign</p>
          <h1 className="text-3xl font-black md:text-5xl">Bangladesh’s Favorite Marketplace</h1>
          <p className="mt-3 max-w-xl text-sm text-orange-100">Up to 70% off on electronics, fashion, beauty, and more. Fast nationwide delivery.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/category" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-orange-600">Shop Now</Link>
            <Link href="/category?sort=popular" className="rounded-full border border-white/50 px-4 py-2 text-sm font-semibold hover:bg-white/10">Trending Deals</Link>
          </div>
        </div>

        <div className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase text-orange-500">Flash Sale Ends In</p>
          <p className="mt-2 text-3xl font-black tracking-wider">{flashSaleEndsIn}</p>
          <p className="mt-2 text-sm text-slate-600">
            {flashSale.status === 'active'
              ? `${flashSale.count} product${flashSale.count === 1 ? '' : 's'} are on flash sale right now.`
              : 'No flash sale is running at the moment.'}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 md:px-6">
        <h2 className="mb-4 text-xl font-bold">Shop by Category</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {SHOP_CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href={`/category?category=${encodeURIComponent(cat.label)}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-center transition hover:border-orange-300 hover:shadow"
            >
              <p className="text-2xl">{cat.emoji}</p>
              <p className="mt-2 text-sm font-semibold">{cat.label}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 md:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Featured Products</h2>
          <Link href="/category" className="text-sm font-semibold text-orange-500">View all</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => <ProductCard key={product._id} product={product} />)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 md:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Trending Now</h2>
          <Link href="/category?sort=popular" className="text-sm font-semibold text-orange-500">See trending</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trending.map((product) => <ProductCard key={product._id} product={product} />)}
        </div>
      </section>
    </MarketplaceLayout>
  );
}
