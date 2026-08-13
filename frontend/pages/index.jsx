import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import MarketplaceLayout from '../components/MarketplaceLayout';
import ProductCard from '../components/ProductCard';
import { resolveImageSrc } from '../utils/resolveImageSrc';
import SmartImage from '../components/SmartImage';
import SEO from '../components/SEO';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

function getSiteUrl() {
  const base = process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://open-bazar.me';
  return base.replace(/\/$/, '');
}

const SHOP_CATEGORIES = [
  { label: 'Electronics', emoji: '📱', color: 'from-blue-600 to-indigo-600', tag: 'Trending' },
  { label: 'Fashion', emoji: '👗', color: 'from-pink-500 to-rose-600', tag: 'New' },
  { label: 'Beauty', emoji: '💄', color: 'from-purple-500 to-fuchsia-600', tag: 'Hot' },
  { label: 'Home & Living', emoji: '🏠', color: 'from-emerald-500 to-teal-600', tag: 'Sale' },
  { label: 'Sports', emoji: '⚽', color: 'from-sky-500 to-blue-600', tag: 'Popular' },
  { label: 'Toys', emoji: '🧸', color: 'from-amber-400 to-orange-500', tag: 'Kids' },
  { label: 'Grocery', emoji: '🛒', color: 'from-lime-500 to-green-600', tag: 'Daily' },
  { label: 'Food', emoji: '🍔', color: 'from-rose-500 to-red-600', tag: 'Fresh' },
];

const BANNERS = [
  {
    title: "Bangladesh's Premier Online Marketplace",
    subtitle: 'Discover verified sellers, guaranteed authenticity & express nationwide delivery.',
    badge: '🎉 MEGA CAMPAIGN',
    cta: 'Explore Collection',
    href: '/category',
    bg: 'from-blue-700 via-indigo-700 to-violet-800',
    highlight: 'Up to 70% Off',
  },
  {
    title: 'Top Gadgets & Tech Bonanza',
    subtitle: 'Smartphones, smartwatches & audio gear with same-day Dhaka delivery.',
    badge: '⚡ FLASH DEALS',
    cta: 'Shop Electronics',
    href: '/category?category=Electronics',
    bg: 'from-slate-900 via-indigo-950 to-blue-900',
    highlight: 'Official Warranty',
  },
  {
    title: 'Exclusive Fashion & Styles',
    subtitle: 'Premium collections for Men, Women & Kids at unbeatable direct prices.',
    badge: '👗 FASHION WEEK',
    cta: 'Browse Fashion',
    href: '/category?category=Fashion',
    bg: 'from-pink-600 via-rose-600 to-purple-800',
    highlight: 'New Arrivals',
  },
  {
    title: 'Home Essentials & Decor',
    subtitle: 'Transform your living space with curated kitchenware & premium decor.',
    badge: '🏠 LIFESTYLE',
    cta: 'Shop Home',
    href: '/category?category=Home%20%26%20Living',
    bg: 'from-emerald-600 via-teal-700 to-cyan-900',
    highlight: 'Best Sellers',
  },
];

function HeroBanner() {
  const [slide, setSlide] = useState(0);
  const timerRef = useRef(null);

  const next = () => setSlide((s) => (s + 1) % BANNERS.length);
  const prev = () => setSlide((s) => (s - 1 + BANNERS.length) % BANNERS.length);

  useEffect(() => {
    timerRef.current = setInterval(next, 6000);
    return () => clearInterval(timerRef.current);
  }, []);

  const banner = BANNERS[slide];

  return (
    <div className={`relative flex min-h-[380px] flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-r ${banner.bg} p-8 md:p-12 text-white shadow-xl transition-all duration-700`}>
      {/* Background ambient elements */}
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-20 right-20 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

      {/* Top Badge & Highlight */}
      <div className="relative z-10 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1 text-xs font-black tracking-wider uppercase backdrop-blur-md border border-white/20">
          {banner.badge}
        </span>
        <span className="rounded-full bg-amber-400/90 px-3 py-1 text-xs font-black text-slate-950 shadow-sm">
          ✨ {banner.highlight}
        </span>
      </div>

      {/* Middle Content */}
      <div className="relative z-10 my-4 max-w-xl">
        <h1 className="text-3xl font-black tracking-tight md:text-5xl lg:text-5xl leading-tight">
          {banner.title}
        </h1>
        <p className="mt-3 text-sm md:text-base text-white/90 leading-relaxed font-medium">
          {banner.subtitle}
        </p>
      </div>

      {/* Actions & Navigation */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex flex-wrap gap-3">
          <Link
            href={banner.href}
            className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs md:text-sm font-extrabold text-slate-900 shadow-lg hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <span>{banner.cta}</span>
            <span>→</span>
          </Link>
          <Link
            href="/category?sort=popular"
            className="rounded-full border border-white/40 bg-white/10 px-5 py-3 text-xs md:text-sm font-bold text-white backdrop-blur-sm hover:bg-white/20 transition duration-200"
          >
            🔥 Top Deals
          </Link>
        </div>

        {/* Indicators */}
        <div className="flex items-center gap-2">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === slide ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              title={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Left/Right Nav Arrows */}
      <button
        type="button"
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition z-20"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition z-20"
      >
        ›
      </button>
    </div>
  );
}

export default function Home({
  initialProducts = [],
  initialFlashSale = { status: 'inactive', count: 0, nextEndsAt: null },
  initialSalesAndPreorders = [],
}) {
  const [products, setProducts] = useState(initialProducts);
  const [flashSale, setFlashSale] = useState(initialFlashSale);
  const [flashSaleEndsIn, setFlashSaleEndsIn] = useState('00:00:00');
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [salesAndPreorders, setSalesAndPreorders] = useState(initialSalesAndPreorders);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/dashboard/visit`, { method: 'POST' }).catch(() => {});

    if (!initialProducts?.length) {
      fetch(`${API_BASE}/products?limit=24`)
        .then((r) => r.json())
        .then((data) => setProducts(Array.isArray(data.products) ? data.products : (Array.isArray(data) ? data : [])))
        .catch(() => setProducts([]));
    }

    if (!initialFlashSale?.nextEndsAt && initialFlashSale?.status !== 'active') {
      fetch(`${API_BASE}/dashboard/flash-sale`)
        .then((r) => r.json())
        .then((data) => setFlashSale({ status: data?.status || 'inactive', count: Number(data?.count || 0), nextEndsAt: data?.nextEndsAt || null }))
        .catch(() => {});
    }

    if (!initialSalesAndPreorders?.length) {
      fetch(`${API_BASE}/products?saleType=sale,preorder&limit=8`)
        .then((r) => r.json())
        .then((data) => setSalesAndPreorders(Array.isArray(data.products) ? data.products : []))
        .catch(() => setSalesAndPreorders([]));
    }

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

  const copyCoupon = (code) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCoupon(true);
      setTimeout(() => setCopiedCoupon(false), 2000);
    }
  };

  const siteUrl = getSiteUrl();
  const homeJsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'OpenBazar',
      url: siteUrl,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'OpenBazar',
      url: siteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/category?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    }
  ];

  return (
    <MarketplaceLayout>
      <SEO
        title="OpenBazar — Online Shopping Marketplace in Bangladesh"
        description="Shop electronics, fashion, beauty, home & groceries from verified sellers on OpenBazar. Secure payments & fast nationwide delivery across Bangladesh."
        canonical="/"
        jsonLd={homeJsonLd}
      />

      {/* ── Top Hero Bento Showcase ── */}
      <section className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_310px] items-stretch">
          <HeroBanner />

          {/* Bento Side Cards */}
          <div className="flex flex-col gap-4">
            {/* Flash Sale Spotlight Card */}
            <div className="flex-1 flex flex-col justify-between rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/40 to-blue-50/60 p-6 shadow-sm">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-[11px] font-black text-rose-600 uppercase tracking-wider">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                    ⚡ Flash Drops
                  </span>
                  <span className="text-xs font-bold text-indigo-600">LIVE</span>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Campaign Ends In</p>
                  <p className="mt-1 text-3xl font-black tracking-widest text-slate-900 font-mono">
                    {flashSaleEndsIn}
                  </p>
                </div>

                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  {flashSale.status === 'active'
                    ? `🔥 Limited stocks with up to 70% direct price drops across ${flashSale.count} items.`
                    : 'Exclusive daily flash drops with limited stock discounts in Bangladesh.'}
                </p>
              </div>

              <Link
                href="/category?saleType=sale,preorder"
                className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-xs font-black text-white shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:scale-[1.02] active:scale-[0.98] transition duration-200"
              >
                <span>View Flash Deals</span>
                <span>→</span>
              </Link>
            </div>

            {/* Free Delivery Benefit Card */}
            <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-sm flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-100">
                  <span>🎁</span>
                  <span>Super Saver Offer</span>
                </div>
                <h4 className="mt-0.5 text-lg font-black leading-tight">Free Delivery</h4>
                <p className="text-xs text-emerald-100 mt-0.5">Order 4+ items to get 100% free delivery nationwide.</p>
              </div>
              <Link
                href="/category"
                className="flex-shrink-0 rounded-xl bg-white px-3.5 py-2 text-xs font-extrabold text-emerald-800 shadow hover:bg-emerald-50 transition"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof & Trust Strip ── */}
      <div className="border-y border-slate-200/80 bg-white/80 backdrop-blur-sm py-3 text-xs font-bold text-slate-700">
        <div className="mx-auto max-w-7xl px-4 flex flex-wrap items-center justify-around gap-4 md:px-6">
          <div className="flex items-center gap-2">
            <span className="text-base">🚚</span>
            <span>Fast Nationwide Delivery (Dhaka 24h)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">🛡️</span>
            <span>100% Buyer Protection Guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">💳</span>
            <span>Cash on Delivery & Mobile Banking</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">⭐</span>
            <span>4.9/5 Rating from 50,000+ Customers</span>
          </div>
        </div>
      </div>

      {/* ── Categories Grid ── */}
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600">Curated Collections</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Explore Categories</h2>
          </div>
          <Link href="/category" className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1">
            <span>View All</span>
            <span>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {SHOP_CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href={`/category?category=${encodeURIComponent(cat.label)}`}
              className="group relative flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-[0_12px_24px_rgba(99,102,241,0.12)]"
            >
              <span className="absolute top-2 right-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
                {cat.tag}
              </span>
              <div className={`mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${cat.color} text-2xl text-white shadow-md shadow-indigo-500/10 transition-transform duration-300 group-hover:scale-110`}>
                {cat.emoji}
              </div>
              <p className="mt-2.5 text-xs font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                {cat.label}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Flash Sales & Pre-orders ── */}
      {salesAndPreorders.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          <div className="mb-5 flex items-center justify-between rounded-2xl bg-gradient-to-r from-rose-500/10 via-orange-500/5 to-transparent p-4 border border-rose-100">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 text-lg text-white shadow-md shadow-rose-500/20">
                ⚡
              </span>
              <div>
                <h2 className="text-lg md:text-xl font-black text-slate-900">Flash Deals & Pre-Orders</h2>
                <p className="text-xs text-slate-500">Limited quantities with maximum markdown savings</p>
              </div>
            </div>
            <Link
              href="/category?saleType=sale,preorder"
              className="rounded-full bg-white px-4 py-2 text-xs font-black text-rose-600 shadow-sm border border-rose-200 hover:bg-rose-50 transition"
            >
              See All Drops →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {salesAndPreorders.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}

      {/* ── Featured Products ── */}
      <section className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600">Hand-Picked Picks</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Featured Products</h2>
          </div>
          <Link href="/category" className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1">
            <span>Browse All</span>
            <span>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      </section>

      {/* ── Promo Tri-Banner ── */}
      <section className="mx-auto max-w-7xl px-4 py-4 md:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 p-6 text-white shadow-md">
            <span className="text-3xl">🚚</span>
            <h3 className="mt-3 text-xl font-black">Express Delivery</h3>
            <p className="mt-1 text-xs text-indigo-200 leading-relaxed">Same-day in Dhaka and 48-72h across all 64 districts of Bangladesh.</p>
            <Link href="/category" className="mt-4 inline-flex items-center gap-1 text-xs font-black text-amber-300 hover:text-amber-200 transition">
              <span>Order Now</span>
              <span>→</span>
            </Link>
          </div>

          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900 via-fuchsia-900 to-pink-900 p-6 text-white shadow-md">
            <span className="text-3xl">✨</span>
            <h3 className="mt-3 text-xl font-black">VIP Promo Code</h3>
            <p className="mt-1 text-xs text-pink-200 leading-relaxed">Use promo code below at checkout to unlock instant discounts.</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="rounded-lg bg-white/20 px-3 py-1 text-xs font-mono font-bold tracking-wider">OPEN100</span>
              <button
                type="button"
                onClick={() => copyCoupon('OPEN100')}
                className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-slate-900 hover:bg-slate-100 transition"
              >
                {copiedCoupon ? 'Copied! ✓' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 p-6 text-white shadow-md">
            <span className="text-3xl">🏪</span>
            <h3 className="mt-3 text-xl font-black">Become a Seller</h3>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">Sell your products to thousands of active buyers with 0% setup fee.</p>
            <Link href="/become-seller" className="mt-4 inline-flex items-center gap-1 rounded-xl bg-orange-500 px-4 py-1.5 text-xs font-black text-white hover:bg-orange-600 transition shadow">
              <span>Start Selling</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trending Deals ── */}
      {trending.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-rose-500">Popular Demands</span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">🔥 Trending Right Now</h2>
            </div>
            <Link href="/category?sort=popular" className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1">
              <span>See All</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {trending.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}

      {/* ── Recently Viewed ── */}
      {recentlyViewed.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          <h2 className="mb-4 text-lg font-extrabold text-slate-800 flex items-center gap-2">
            <span>👁️</span>
            <span>Recently Viewed</span>
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {recentlyViewed.map((p) => (
              <Link
                key={p._id}
                href={`/product/${p._id}`}
                className="group rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-50">
                  <SmartImage
                    src={resolveImageSrc(p.images?.[0] || p.photos?.[0] || p.image || p.thumbnail)}
                    alt={p.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 16vw"
                    className="object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <p className="mt-2 line-clamp-1 text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition">
                  {p.name}
                </p>
                <p className="mt-0.5 text-xs font-black text-slate-900">
                  ৳{Number(p.discountPrice ?? p.price ?? 0).toFixed(0)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Why OpenBazar Luxury Badges ── */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="text-center mb-8">
          <span className="text-xs font-black uppercase tracking-wider text-indigo-600">The OpenBazar Difference</span>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-1">Why Shop with Us?</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: '🚀', title: 'Express Delivery', desc: 'Same-day in Dhaka and fast 48h courier across all 64 districts.' },
            { icon: '🔒', title: '100% Safe Payments', desc: 'Cash on Delivery, bKash, Nagad, and Rocket with buyer protection.' },
            { icon: '↩️', title: 'Easy Returns Policy', desc: 'Hassle-free 3-day return policy for verified non-perishable goods.' },
            { icon: '🎖️', title: 'Vetted Verified Sellers', desc: 'Every seller is verified with identity checks and store audits.' },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-3xl border border-slate-200/80 bg-white p-6 text-center shadow-sm transition hover:shadow-md hover:border-indigo-200"
            >
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                {f.icon}
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </MarketplaceLayout>
  );
}

export async function getServerSideProps() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.API_BASE || 'http://localhost:5000/api';

  const fetchJson = async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  const [productsRes, flashSaleRes, salesRes] = await Promise.all([
    fetchJson(`${API_BASE}/products?limit=24`),
    fetchJson(`${API_BASE}/dashboard/flash-sale`),
    fetchJson(`${API_BASE}/products?saleType=sale,preorder&limit=8`),
  ]);

  const initialProducts = Array.isArray(productsRes?.products)
    ? productsRes.products
    : (Array.isArray(productsRes) ? productsRes : []);

  const initialFlashSale = flashSaleRes
    ? { status: flashSaleRes?.status || 'inactive', count: Number(flashSaleRes?.count || 0), nextEndsAt: flashSaleRes?.nextEndsAt || null }
    : { status: 'inactive', count: 0, nextEndsAt: null };

  const initialSalesAndPreorders = Array.isArray(salesRes?.products) ? salesRes.products : [];

  return {
    props: {
      initialProducts,
      initialFlashSale,
      initialSalesAndPreorders,
    },
  };
}
