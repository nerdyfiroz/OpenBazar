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
  { label: 'Electronics', emoji: '📱', color: 'from-blue-500 to-indigo-500' },
  { label: 'Fashion', emoji: '👗', color: 'from-pink-500 to-rose-500' },
  { label: 'Beauty', emoji: '💄', color: 'from-purple-500 to-fuchsia-500' },
  { label: 'Home & Living', emoji: '🏠', color: 'from-green-500 to-emerald-500' },
  { label: 'Sports', emoji: '⚽', color: 'from-sky-500 to-blue-500' },
  { label: 'Toys', emoji: '🧸', color: 'from-yellow-400 to-amber-400' },
  { label: 'Grocery', emoji: '🛒', color: 'from-lime-500 to-green-500' },
  { label: 'Food', emoji: '🍔', color: 'from-rose-400 to-pink-500' },
  { label: 'Mango', emoji: '🥭', color: 'from-amber-400 to-orange-500' },
];

const BANNERS = [
  {
    title: '🥭 Special Summer Mango Festival',
    subtitle: 'Farm fresh mangoes, 10kg to 40kg. Special ৳10/kg delivery!',
    badge: '🌞 Summer Special',
    cta: 'Shop Mangoes',
    href: '/category?category=Mango',
    bg: 'from-amber-400 via-orange-500 to-rose-500',
  },
  {
    title: "Bangladesh's Favorite Marketplace",
    subtitle: 'Up to 70% off on electronics, fashion, beauty & more.',
    badge: '🎉 Mega Campaign',
    cta: 'Shop Now',
    href: '/category',
    bg: 'from-blue-600 via-indigo-600 to-violet-600',
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
    bg: 'from-cyan-600 via-sky-600 to-blue-600',
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
            className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-indigo-600 hover:scale-105 transition-transform shadow">
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

  useEffect(() => {
    fetch(`${API_BASE}/dashboard/visit`, { method: 'POST' }).catch(() => {});

    // If SSR didn't provide data (or API failed), fetch on client as a fallback.
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

  const siteUrl = getSiteUrl();
  const homeJsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'OpenBazar',
      url: siteUrl,
      logo: `${siteUrl}/api/logo`,
      email: 'support@open-bazar.me',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Dhaka',
        addressCountry: 'BD'
      }
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
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SaleEvent',
      name: 'Summer Mango Festival 2025',
      description: 'Buy fresh farm mangoes online — 10kg to 40kg packs with special ৳10/kg delivery across Bangladesh. Limited summer offer on OpenBazar.',
      startDate: '2025-04-01',
      endDate: '2025-08-31',
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      location: {
        '@type': 'VirtualLocation',
        url: `${siteUrl}/category?category=Mango`
      },
      organizer: {
        '@type': 'Organization',
        name: 'OpenBazar',
        url: siteUrl
      },
      offers: {
        '@type': 'Offer',
        url: `${siteUrl}/category?category=Mango`,
        priceCurrency: 'BDT',
        availability: 'https://schema.org/InStock',
        description: 'Fresh mangoes from ৳10/kg delivery. Minimum order 10kg.'
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Where can I buy fresh mangoes online in Bangladesh?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'You can buy fresh mangoes directly from verified farmers and sellers on OpenBazar. We offer farm-fresh Rajshahi, Chapai, Langra, Himsagar and Fazli mangoes with nationwide delivery.'
          }
        },
        {
          '@type': 'Question',
          name: 'What is the delivery charge for mangoes on OpenBazar?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Mango delivery is available at a special summer rate of ৳10 per kg. For a 10kg pack the delivery cost is ৳100, for 20kg it is ৳200, and so on.'
          }
        },
        {
          '@type': 'Question',
          name: 'Can I buy mangoes in bulk online from Bangladesh?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! OpenBazar lets you buy mangoes in bulk packs of 10kg, 15kg, 20kg, 30kg and 40kg directly from farm-to-door verified sellers at the best prices.'
          }
        }
      ]
    }
  ];

  return (
    <MarketplaceLayout>
      <SEO
        title="Buy Mango Online Bangladesh | Summer Mango Sale 2025"
        description="Shop fresh farm mangoes online in Bangladesh — 10kg to 40kg, ৳10/kg delivery. Also find electronics, fashion, beauty & groceries from verified sellers on OpenBazar. Summer sale on now!"
        canonical="/"
        jsonLd={homeJsonLd}
        keywords="buy mango online Bangladesh, fresh mango delivery, summer mango sale, আম কিনুন অনলাইন, আম ডেলিভারি বাংলাদেশ, mango festival Bangladesh, Rajshahi mango buy, Chapai mango online, আমের দাম, সেরা আম কোথায় পাওয়া যায়, OpenBazar mango, online marketplace Bangladesh"
      />
      {/* ── Hero Banner Carousel ── */}
      <section className="mx-auto max-w-7xl grid gap-4 px-4 py-6 md:grid-cols-[1fr_280px] md:px-6">
        <HeroBanner />

        {/* Flash sale panel */}
        <div className="flex flex-col justify-center rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">⚡ Flash Sale Ends In</p>
          <p className="mt-2 text-4xl font-black tracking-widest text-slate-800">{flashSaleEndsIn}</p>
          <p className="mt-2 text-sm text-slate-500">
            {flashSale.status === 'active'
              ? `🔥 ${flashSale.count} item${flashSale.count === 1 ? '' : 's'} on flash sale!`
              : 'No flash sale active right now.'}
          </p>
          {flashSale.status === 'active' && (
            <Link href="/category?saleType=sale,preorder" className="mt-4 rounded-xl bg-indigo-500 px-4 py-2 text-center text-sm font-bold text-white hover:bg-indigo-600">
              Shop Flash Deals →
            </Link>
          )}
        </div>
      </section>

      {/* ── Marquee trust bar ── */}
      <div className="overflow-hidden border-y border-slate-100 bg-white py-2 text-xs text-slate-500">
        <div className="animate-marquee flex gap-16 whitespace-nowrap px-4">
          {['🚚 Fast Nationwide Delivery', '🥭 Summer Mango Festival - ৳10/kg Delivery!', '🔒 Secure Payments', '💯 100% Authentic Products', '↩️ 3-Day Easy Returns', '🎁 Free Delivery on 4+ Items', '⭐ 50,000+ Happy Customers', '🏪 Trusted Sellers Only'].map((t) => (
            <span key={t}>{t}</span>
          ))}
          {/* Duplicate for seamless loop */}
          {['🚚 Fast Nationwide Delivery', '🥭 Summer Mango Festival - ৳10/kg Delivery!', '🔒 Secure Payments', '💯 100% Authentic Products', '↩️ 3-Day Easy Returns', '🎁 Free Delivery on 4+ Items', '⭐ 50,000+ Happy Customers', '🏪 Trusted Sellers Only'].map((t) => (
            <span key={`dup-${t}`}>{t}</span>
          ))}
        </div>
      </div>

      {/* ── Categories ── */}
      <section className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <h2 className="mb-4 text-xl font-bold">Shop by Category</h2>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 md:grid-cols-9">
          {SHOP_CATEGORIES.map((cat) => (
            <Link key={cat.label} href={`/category?category=${encodeURIComponent(cat.label)}`}
              className="group flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${cat.color} text-3xl shadow-sm transition-transform group-hover:scale-110`}>
                {cat.emoji}
              </div>
              <p className="mt-3 text-sm font-bold text-slate-700">{cat.label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Flash Sales & Pre-orders ── */}
      {salesAndPreorders.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">⚡ Flash Sales & Pre-orders</h2>
            <Link href="/category?saleType=sale,preorder" className="rounded-full border border-indigo-200 px-3 py-1 text-sm font-semibold text-indigo-500 hover:bg-indigo-50">View all →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {salesAndPreorders.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}

      {/* ── Featured Products ── */}
      <section className="mx-auto max-w-7xl px-4 py-4 md:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Featured Products</h2>
          <Link href="/category" className="rounded-full border border-indigo-200 px-3 py-1 text-sm font-semibold text-indigo-500 hover:bg-indigo-50">View all →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      </section>

      {/* ── Promo banner strip ── */}
      <section className="mx-auto max-w-7xl px-4 py-4 md:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-400 p-5 text-white">
            <p className="text-2xl font-black">Free Delivery</p>
            <p className="mt-1 text-sm text-indigo-100">On orders with 4+ items</p>
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
          <Link href="/category?sort=popular" className="rounded-full border border-indigo-200 px-3 py-1 text-sm font-semibold text-indigo-500 hover:bg-indigo-50">See all →</Link>
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
                <div className="relative h-28 w-full overflow-hidden rounded-xl bg-slate-100">
                  <SmartImage
                    src={resolveImageSrc(p.images?.[0] || p.photos?.[0])}
                    alt={p.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 16vw"
                    className="object-cover group-hover:opacity-90"
                  />
                </div>
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
            { icon: '↩️', title: 'Easy Returns', desc: '3-day hassle-free return policy. Food & pre-order items are non-returnable.' },
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
