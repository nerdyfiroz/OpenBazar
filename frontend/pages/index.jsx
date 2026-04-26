import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import MarketplaceLayout from '../components/MarketplaceLayout';
import ProductCard from '../components/ProductCard';
import { resolveImageSrc, FALLBACK_IMAGE } from '../utils/resolveImageSrc';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

const SHOP_CATEGORIES = [
  { label: 'Electronics', emoji: '📱', color: 'from-blue-500 to-indigo-500' },
  { label: 'Fashion', emoji: '👗', color: 'from-pink-500 to-rose-500' },
  { label: 'Beauty', emoji: '💄', color: 'from-purple-500 to-fuchsia-500' },
  { label: 'Home & Living', emoji: '🏠', color: 'from-green-500 to-emerald-500' },
  { label: 'Sports', emoji: '⚽', color: 'from-orange-500 to-amber-500' },
  { label: 'Books', emoji: '📚', color: 'from-teal-500 to-cyan-500' },
  { label: 'Toys', emoji: '🧸', color: 'from-yellow-500 to-orange-400' },
  { label: 'Grocery', emoji: '🛒', color: 'from-lime-500 to-green-500' },
];

const BANNERS = [
  {
    title: "Bangladesh's Favorite Marketplace",
    subtitle: 'Up to 70% off on electronics, fashion, beauty & more.',
    badge: '🎉 Mega Campaign',
    cta: 'Shop Now',
    href: '/category',
    bg: 'from-orange-500 via-orange-600 to-amber-500',
  },
  {
    title: 'Fashion Week Sale',
    subtitle: 'Trending styles at unbeatable prices. Free delivery on 3+ items.',
    badge: '👗 Fashion',
    cta: 'Browse Fashion',
    href: '/category?category=Fashion',
    bg: 'from-pink-500 via-fuchsia-600 to-purple-600',
  },
  {
    title: 'Electronics Bonanza',
    subtitle: 'Latest gadgets, phones & accessories. Fast same-day delivery in Dhaka.',
    badge: '⚡ Flash Deals',
    cta: 'Explore Gadgets',
    href: '/category?category=Electronics',
    bg: 'from-blue-600 via-indigo-600 to-violet-600',
  },
  {
    title: 'Home & Kitchen Essentials',
    subtitle: 'Upgrade your space with premium quality home products.',
    badge: '🏠 Home',
    cta: 'Shop Home',
    href: '/category?category=Home%20%26%20Living',
    bg: 'from-green-500 via-emerald-600 to-teal-600',
  },
];

function HeroBanner() {
  const [slide, setSlide] = useState(0);
  const timerRef = useRef(null);

  const next = () => setSlide((s) => (s + 1) % BANNERS.length);
  const prev = () => setSlide((s) => (s - 1 + BANNERS.length) % BANNERS.length);

  useEffect(() => {
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, []);

  const banner = BANNERS[slide];

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${banner.bg} p-8 text-white transition-all duration-700`}>
      <div className="relative z-10">
        <span className="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
          {banner.badge}
        </span>
        <h1 className="text-3xl font-black leading-tight md:text-5xl">{banner.title}</h1>
        <p className="mt-3 max-w-xl text-sm text-white/80">{banner.subtitle}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={banner.href}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-orange-600 hover:scale-105 transition-transform shadow">
            {banner.cta}
          </Link>
          <Link href="/category?sort=popular"
            className="rounded-full border border-white/50 px-5 py-2.5 text-sm font-semibold hover:bg-white/10 transition">
            Trending Deals
          </Link>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-8 flex gap-2">
        {BANNERS.map((_, i) => (
          <button key={i} onClick={() => setSlide(i)}
            className={`h-2 rounded-full transition-all ${i === slide ? 'w-6 bg-white' : 'w-2 bg-white/40'}`} />
        ))}
      </div>

      {/* Arrows */}
      <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white hover:bg-black/40">‹</button>
      <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/20 p-2 text-white hover:bg-black/40">›</button>

      {/* Decorative circles */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-16 right-24 h-56 w-56 rounded-full bg-white/5" />
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [flashSale, setFlashSale] = useState({ status: 'inactive', count: 0, nextEndsAt: null });
  const [flashSaleEndsIn, setFlashSaleEndsIn] = useState('00:00:00');
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/dashboard/visit`, { method: 'POST' }).catch(() => {});

    fetch(`${API_BASE}/products?limit=24`)
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data.products) ? data.products : (Array.isArray(data) ? data : [])))
      .catch(() => setProducts([]));

    fetch(`${API_BASE}/dashboard/flash-sale`)
      .then((r) => r.json())
      .then((data) => setFlashSale({ status: data?.status || 'inactive', count: Number(data?.count || 0), nextEndsAt: data?.nextEndsAt || null }))
      .catch(() => {});

    // Load recently viewed from localStorage
    try {
      const rv = JSON.parse(localStorage.getItem('ob_recently_viewed') || '[]');
      setRecentlyViewed(Array.isArray(rv) ? rv.slice(0, 6) : []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const update = () => {
      if (!flashSale.nextEndsAt) { setFlashSaleEndsIn('00:00:00'); return; }
      const diff = Math.max(0, new Date(flashSale.nextEndsAt).getTime() - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setFlashSaleEndsIn(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [flashSale.nextEndsAt]);

  const featured = products.slice(0, 8);
  const trending = products.slice(8, 16);

  return (
    <MarketplaceLayout>
      {/* ── Hero Banner Carousel ── */}
      <section className="mx-auto max-w-7xl grid gap-4 px-4 py-6 md:grid-cols-[1fr_280px] md:px-6">
        <HeroBanner />

        {/* Flash sale panel */}
        <div className="flex flex-col justify-center rounded-3xl border border-orange-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">⚡ Flash Sale Ends In</p>
          <p className="mt-2 text-4xl font-black tracking-widest text-slate-800">{flashSaleEndsIn}</p>
          <p className="mt-2 text-sm text-slate-500">
            {flashSale.status === 'active'
              ? `🔥 ${flashSale.count} item${flashSale.count === 1 ? '' : 's'} on flash sale!`
              : 'No flash sale active right now.'}
          </p>
          {flashSale.status === 'active' && (
            <Link href="/category?sort=popular" className="mt-4 rounded-xl bg-orange-500 px-4 py-2 text-center text-sm font-bold text-white hover:bg-orange-600">
              Shop Flash Deals →
            </Link>
          )}
        </div>
      </section>

      {/* ── Marquee trust bar ── */}
      <div className="overflow-hidden border-y border-slate-100 bg-white py-2 text-xs text-slate-500">
        <div className="animate-marquee flex gap-16 whitespace-nowrap px-4">
          {['🚚 Fast Nationwide Delivery', '🔒 Secure Payments', '💯 100% Authentic Products', '↩️ Easy Returns', '🎁 Free Delivery on 4+ Items', '⭐ 50,000+ Happy Customers', '🏪 Trusted Sellers Only'].map((t) => (
            <span key={t}>{t}</span>
          ))}
          {/* Duplicate for seamless loop */}
          {['🚚 Fast Nationwide Delivery', '🔒 Secure Payments', '💯 100% Authentic Products', '↩️ Easy Returns', '🎁 Free Delivery on 4+ Items', '⭐ 50,000+ Happy Customers', '🏪 Trusted Sellers Only'].map((t) => (
            <span key={`dup-${t}`}>{t}</span>
          ))}
        </div>
      </div>

      {/* ── Categories ── */}
      <section className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <h2 className="mb-4 text-xl font-bold">Shop by Category</h2>
        <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
          {SHOP_CATEGORIES.map((cat) => (
            <Link key={cat.label} href={`/category?category=${encodeURIComponent(cat.label)}`}
              className="group flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${cat.color} text-2xl shadow-sm`}>
                {cat.emoji}
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-700">{cat.label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="mx-auto max-w-7xl px-4 py-4 md:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Featured Products</h2>
          <Link href="/category" className="rounded-full border border-orange-200 px-3 py-1 text-sm font-semibold text-orange-500 hover:bg-orange-50">View all →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      </section>

      {/* ── Promo banner strip ── */}
      <section className="mx-auto max-w-7xl px-4 py-4 md:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 p-5 text-white">
            <p className="text-2xl font-black">Free Delivery</p>
            <p className="mt-1 text-sm text-orange-100">On orders with 4+ items</p>
            <Link href="/category" className="mt-3 inline-block rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold hover:bg-white/30">Shop Now</Link>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 p-5 text-white">
            <p className="text-2xl font-black">New Arrivals</p>
            <p className="mt-1 text-sm text-violet-200">Fresh products every day</p>
            <Link href="/category?sort=newest" className="mt-3 inline-block rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold hover:bg-white/30">Explore</Link>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-5 text-white">
            <p className="text-2xl font-black">Become a Seller</p>
            <p className="mt-1 text-sm text-emerald-100">Sell to thousands of buyers</p>
            <Link href="/become-seller" className="mt-3 inline-block rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold hover:bg-white/30">Start Today</Link>
          </div>
        </div>
      </section>

      {/* ── Trending ── */}
      <section className="mx-auto max-w-7xl px-4 py-4 md:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">🔥 Trending Now</h2>
          <Link href="/category?sort=popular" className="rounded-full border border-orange-200 px-3 py-1 text-sm font-semibold text-orange-500 hover:bg-orange-50">See all →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trending.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      </section>

      {/* ── Recently Viewed ── */}
      {recentlyViewed.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          <h2 className="mb-4 text-xl font-bold">👁️ Recently Viewed</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {recentlyViewed.map((p) => (
              <Link key={p._id} href={`/product/${p._id}`}
                className="group rounded-2xl border border-slate-200 bg-white p-3 hover:shadow-md transition">
                <img src={resolveImageSrc(p.images?.[0] || p.photos?.[0])} alt={p.name}
                  className="h-28 w-full rounded-xl object-cover group-hover:opacity-90"
                  onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }} />
                <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-700">{p.name}</p>
                <p className="mt-1 text-sm font-black text-orange-500">৳{Number(p.discountPrice ?? p.price ?? 0).toFixed(0)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Why OpenBazar ── */}
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <h2 className="mb-6 text-center text-2xl font-bold">Why Shop with OpenBazar?</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: '🚚', title: 'Fast Delivery', desc: 'Same-day delivery in Dhaka, next-day nationwide.' },
            { icon: '🔒', title: 'Secure Payments', desc: 'bKash, Nagad, Rocket & Cash on Delivery.' },
            { icon: '↩️', title: 'Easy Returns', desc: '7-day hassle-free return policy.' },
            { icon: '🎖️', title: 'Verified Sellers', desc: 'All sellers are manually vetted and approved.' },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm">
              <p className="text-3xl">{f.icon}</p>
              <p className="mt-3 font-bold">{f.title}</p>
              <p className="mt-1 text-xs text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </MarketplaceLayout>
  );
}
