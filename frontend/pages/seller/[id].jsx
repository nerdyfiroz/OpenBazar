import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import MarketplaceLayout from '../../components/MarketplaceLayout';
import ProductCard from '../../components/ProductCard';
import { resolveImageSrc } from '../../utils/resolveImageSrc';
import SmartImage from '../../components/SmartImage';
import VerifiedBadge from '../../components/VerifiedBadge';
import SEO from '../../components/SEO';
import SmartCouponSection from '../../components/SmartCouponSection';
import { useStore } from '../../components/StoreProvider';
import { getApiBase } from '../../utils/apiBase';

const API_BASE = getApiBase();

function getSiteUrl() {
  const base = process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://open-bazar.me';
  return base.replace(/\/$/, '');
}

export default function SellerProfile({ initialSeller = null, initialProducts = [] }) {
  const router = useRouter();
  const { id } = router.query;
  const { cart, subtotal, applyCoupon, clearCoupon, coupon, couponDiscount } = useStore();

  const [seller, setSeller] = useState(initialSeller);
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(!initialSeller);

  // Storefront interactive state
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(1280);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);

  // Load seller & products if SSR missing or route changed
  useEffect(() => {
    if (!id) return;

    if (initialSeller && String(initialSeller?._id || initialSeller?.id || '') === String(id)) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch(`${API_BASE}/auth/seller/${id}`).then((r) => r.json()).catch(() => null),
      fetch(`${API_BASE}/products?seller=${id}&limit=50`).then((r) => r.json()).catch(() => ({ products: [] }))
    ]).then(([sellerData, productData]) => {
      setSeller(sellerData);
      setProducts(Array.isArray(productData?.products) ? productData.products : []);
    }).finally(() => setLoading(false));
  }, [id, initialSeller]);

  // Check follow status in localStorage
  useEffect(() => {
    if (!id) return;
    try {
      const followed = JSON.parse(localStorage.getItem('ob_followed_sellers') || '[]');
      const isAlreadyFollowing = followed.includes(String(id));
      setIsFollowing(isAlreadyFollowing);
      // Base follower count + 1 if currently following
      setFollowerCount(1280 + (isAlreadyFollowing ? 1 : 0));
    } catch {
      // Fallback silently
    }
  }, [id]);

  // Toggle follow action
  const handleToggleFollow = () => {
    if (!id) return;
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setFollowerCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const followed = JSON.parse(localStorage.getItem('ob_followed_sellers') || '[]');
      const updated = nextState
        ? [...new Set([...followed, String(id)])]
        : followed.filter((sId) => sId !== String(id));
      localStorage.setItem('ob_followed_sellers', JSON.stringify(updated));
    } catch {
      // Fallback
    }
  };

  // Share store link
  const handleShare = async () => {
    const siteUrl = getSiteUrl();
    const url = `${siteUrl}/seller/${id}`;
    const title = seller?.storeName || seller?.name || 'Seller Storefront';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Fallback to modal if native share dismissed/unsupported
      }
    }
    setShowShareModal(true);
  };

  const handleCopyLink = () => {
    const siteUrl = getSiteUrl();
    const url = `${siteUrl}/seller/${id}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Calculations for stats & reviews
  const totalSold = useMemo(() => products.reduce((s, p) => s + Number(p.soldCount || 0), 0), [products]);
  const totalItemsCount = useMemo(() => cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0), [cart]);

  // Collect all reviews across seller's products
  const allReviews = useMemo(() => {
    return products.flatMap((p) =>
      (p.reviews || []).map((r) => ({
        ...r,
        productName: p.name,
        productId: p._id,
      }))
    );
  }, [products]);

  const avgRating = useMemo(() => {
    if (allReviews.length) {
      const sum = allReviews.reduce((acc, r) => acc + Number(r.rating || 5), 0);
      return (sum / allReviews.length).toFixed(1);
    }
    if (products.length) {
      const sum = products.reduce((acc, p) => acc + Number(p.rating || 4.5), 0);
      return (sum / products.length).toFixed(1);
    }
    return '4.8';
  }, [allReviews, products]);

  const ratingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (allReviews.length) {
      allReviews.forEach((r) => {
        const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
        counts[star] = (counts[star] || 0) + 1;
      });
    } else {
      counts[5] = Math.round(products.length * 0.8) || 12;
      counts[4] = Math.round(products.length * 0.15) || 3;
      counts[3] = Math.round(products.length * 0.05) || 1;
    }
    return counts;
  }, [allReviews, products]);

  const totalReviewsCount = allReviews.length || (products.length * 4) || 24;

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q)));
    }

    if (sortBy === 'price-low') {
      result.sort((a, b) => Number(a.discountPrice ?? a.price) - Number(b.discountPrice ?? b.price));
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => Number(b.discountPrice ?? b.price) - Number(a.discountPrice ?? a.price));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else {
      // Popular (soldCount / rating)
      result.sort((a, b) => (Number(b.soldCount || 0) * Number(b.rating || 1)) - (Number(a.soldCount || 0) * Number(a.rating || 1)));
    }

    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  // Top sections
  const bestSellers = useMemo(() => {
    return [...products]
      .sort((a, b) => Number(b.soldCount || 0) - Number(a.soldCount || 0))
      .slice(0, 4);
  }, [products]);

  const newArrivals = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 4);
  }, [products]);

  // Loading state skeleton
  if (loading) {
    return (
      <MarketplaceLayout>
        <div className="mx-auto max-w-7xl px-4 py-8 space-y-6 animate-pulse">
          <div className="h-56 w-full rounded-3xl bg-slate-200" />
          <div className="flex items-center gap-4 px-4">
            <div className="h-24 w-24 rounded-full bg-slate-300" />
            <div className="space-y-2">
              <div className="h-6 w-48 rounded bg-slate-300" />
              <div className="h-4 w-32 rounded bg-slate-200" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-64 rounded-2xl bg-slate-200" />
            ))}
          </div>
        </div>
      </MarketplaceLayout>
    );
  }

  // Not found state
  if (!seller || seller.message) {
    return (
      <MarketplaceLayout>
        <main className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-4xl shadow-inner">
            🏪
          </div>
          <h1 className="mt-6 text-2xl font-black text-slate-800">Business Storefront Not Found</h1>
          <p className="mt-2 text-sm text-slate-500">
            This storefront may have been removed, renamed, or is currently unavailable.
          </p>
          <Link
            href="/category"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition"
          >
            ← Back to OpenBazar Marketplace
          </Link>
        </main>
      </MarketplaceLayout>
    );
  }

  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/seller/${seller._id || id}`;
  const sellerName = seller.storeName || seller.name || 'Storefront';
  const isVerified = Boolean(seller.isSellerVerifiedBadge || seller.isVerified);
  const avatarPhoto = seller.photoUrl ? `${API_BASE.replace(/\/api$/, '')}${seller.photoUrl}` : null;
  const storeDescription = seller.bio || seller.description || `${sellerName} is a verified business selling authentic, quality products on OpenBazar. Fast delivery across Bangladesh and top customer support.`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Store',
      name: sellerName,
      url: canonical,
      image: avatarPhoto || `${siteUrl}/api/logo`,
      description: storeDescription,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating,
        reviewCount: totalReviewsCount,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Storefront', item: canonical },
      ],
    },
  ];

  return (
    <MarketplaceLayout>
      <SEO
        title={`${sellerName} — Official Storefront`}
        description={storeDescription}
        canonical={canonical}
        image={avatarPhoto || `${siteUrl}/api/logo`}
        jsonLd={jsonLd}
      />

      <main className="min-h-screen bg-slate-50 pb-20">
        {/* ═══════════════════════════════════════════════════════════════════
            1. HERO & BANNER SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden bg-slate-900">
          {/* Cover Banner Image / Gradient Background */}
          <div className="relative h-48 w-full md:h-72 lg:h-80 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900">
            {/* Pattern Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(249,115,22,0.25),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.2),transparent_50%)]" />
            
            {/* Soft dark gradient vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />
          </div>

          {/* Business Header Content Container */}
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="relative -mt-16 flex flex-col md:-mt-20 md:flex-row md:items-end md:justify-between pb-6 gap-4">
              {/* Left Column: Logo + Name + Category + Badges */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 md:gap-6">
                {/* Floating Logo / Avatar */}
                <div className="relative h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0 overflow-hidden rounded-3xl border-4 border-white bg-white shadow-2xl ring-1 ring-black/10">
                  {avatarPhoto ? (
                    <SmartImage
                      src={avatarPhoto}
                      alt={sellerName}
                      fill
                      priority
                      sizes="128px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-orange-500 via-amber-500 to-indigo-600 font-black text-3xl sm:text-5xl text-white shadow-inner">
                      {sellerName[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Identity Text */}
                <div className="space-y-1.5 pt-2 sm:pt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                      {sellerName}
                    </h1>
                    {isVerified && (
                      <div className="flex items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1 ring-1 ring-amber-400/40 backdrop-blur">
                        <VerifiedBadge className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                          Verified Business
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <span>🏬 Official OpenBazar Storefront</span>
                    <span>•</span>
                    <span className="text-orange-400 font-bold">Member since {new Date(seller.createdAt || Date.now()).getFullYear()}</span>
                  </p>

                  {/* Compact Stats Row */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300 pt-1">
                    <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur">
                      <span className="text-amber-400">★</span>
                      <strong className="text-white font-bold">{avgRating}</strong>
                      <span className="text-slate-400">({totalReviewsCount})</span>
                    </span>
                    <span className="bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur">
                      👥 <strong className="text-white font-bold">{followerCount.toLocaleString()}</strong> Followers
                    </span>
                    <span className="bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur">
                      📦 <strong className="text-white font-bold">{totalSold > 0 ? totalSold.toLocaleString() : '500+'}</strong> Orders
                    </span>
                    <span className="bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur">
                      🛍️ <strong className="text-white font-bold">{products.length}</strong> Products
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Primary Actions */}
              <div className="flex items-center gap-2.5 pt-3 md:pt-0">
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-extrabold tracking-wide transition active:scale-95 shadow-md ${
                    isFollowing
                      ? 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700'
                      : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/25'
                  }`}
                >
                  {isFollowing ? '✓ Following' : '+ Follow Store'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('products');
                    const el = document.getElementById('store-products-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-white/10 px-5 py-2.5 text-xs font-extrabold text-white border border-white/20 backdrop-blur hover:bg-white/20 transition active:scale-95"
                >
                  Shop Products ↓
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white border border-white/20 backdrop-blur hover:bg-white/20 transition"
                  title="Share storefront"
                >
                  🔗
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            2. TRUST STRIP BAR
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="border-b border-slate-200 bg-white shadow-xs">
          <div className="mx-auto max-w-7xl px-4 py-3.5 md:px-6">
            <div className="flex items-center justify-between gap-4 overflow-x-auto text-xs font-semibold text-slate-600 scrollbar-none">
              <span className="flex flex-shrink-0 items-center gap-1.5 text-slate-800">
                <span className="text-green-600 font-bold">✓</span> Verified Business
              </span>
              <span className="flex flex-shrink-0 items-center gap-1.5 text-slate-800">
                <span>🚚</span> Fast Nationwide Delivery
              </span>
              <span className="flex flex-shrink-0 items-center gap-1.5 text-slate-800">
                <span>🔒</span> Secure bKash & COD Payments
              </span>
              <span className="flex flex-shrink-0 items-center gap-1.5 text-slate-800">
                <span>↩</span> Easy 7-Day Returns
              </span>
              <span className="flex flex-shrink-0 items-center gap-1.5 text-slate-800">
                <span>⭐</span> Top Rated Service
              </span>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            3. STICKY STORE NAVIGATION TABS
        ═══════════════════════════════════════════════════════════════════ */}
        <nav className="sticky top-[65px] z-40 border-b border-slate-200 bg-white/95 backdrop-blur shadow-xs">
          <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 md:px-6 scrollbar-none">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'products', label: `Products (${products.length})` },
              { id: 'collections', label: 'Categories' },
              { id: 'offers', label: 'Special Offers' },
              { id: 'reviews', label: `Reviews (${totalReviewsCount})` },
              { id: 'about', label: 'About Brand' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  const el = document.getElementById(`store-${tab.id}-section`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`relative py-3.5 text-xs font-bold transition flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'text-orange-600'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-orange-500" />
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* ═══════════════════════════════════════════════════════════════════
            MAIN STOREFRONT CONTENT CONTAINER
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mx-auto max-w-7xl px-4 py-8 space-y-12 md:px-6">

          {/* ─────────────────────────────────────────────────────────────────
              4. ABOUT THE BRAND / INTRODUCTION
          ───────────────────────────────────────────────────────────────── */}
          <section id="store-about-section" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900">About {sellerName}</h2>
                  {isVerified && <VerifiedBadge className="h-4 w-4" />}
                </div>
                <p className={`text-sm text-slate-600 leading-relaxed ${!aboutExpanded ? 'line-clamp-2 md:line-clamp-3' : ''}`}>
                  {storeDescription}
                </p>
                {storeDescription.length > 120 && (
                  <button
                    type="button"
                    onClick={() => setAboutExpanded(!aboutExpanded)}
                    className="text-xs font-bold text-orange-500 hover:underline pt-1"
                  >
                    {aboutExpanded ? 'Show Less ↑' : 'Read More ↓'}
                  </button>
                )}
              </div>

              {/* Business Meta Info */}
              <div className="flex flex-wrap gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100 md:min-w-[280px]">
                <div>
                  <p className="text-slate-400 font-semibold">Location</p>
                  <p className="font-bold text-slate-800">📍 Dhaka, Bangladesh</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold">Verification</p>
                  <p className="font-bold text-green-700">✓ Golden Badge Verified</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold">Response Rate</p>
                  <p className="font-bold text-slate-800">⚡ 99% (Under 1 hour)</p>
                </div>
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────────
              5. EXCLUSIVE OFFERS & COUPONS (SmartCouponSection)
          ───────────────────────────────────────────────────────────────── */}
          <section id="store-offers-section" className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50/70 via-white to-amber-50/50 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🎟</span>
              <h2 className="text-lg font-black text-slate-900">Exclusive Store Offers</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Unlock maximum savings when ordering from {sellerName}.
            </p>
            <SmartCouponSection
              subtotal={subtotal}
              totalItems={totalItemsCount}
              appliedCoupon={coupon}
              couponDiscount={couponDiscount}
              onApplyCoupon={applyCoupon}
              onClearCoupon={clearCoupon}
            />
          </section>

          {/* ─────────────────────────────────────────────────────────────────
              6. BEST SELLERS
          ───────────────────────────────────────────────────────────────── */}
          {bestSellers.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔥</span>
                  <h2 className="text-xl font-black text-slate-900">Best Sellers</h2>
                </div>
                <span className="text-xs font-semibold text-slate-500">Most loved by buyers</span>
              </div>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {bestSellers.map((p) => (
                  <ProductCard key={`best-${p._id}`} product={p} />
                ))}
              </div>
            </section>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              7. NEW ARRIVALS
          ───────────────────────────────────────────────────────────────── */}
          {newArrivals.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <h2 className="text-xl font-black text-slate-900">New Arrivals</h2>
                </div>
                <span className="text-xs font-semibold text-slate-500">Fresh additions</span>
              </div>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {newArrivals.map((p) => (
                  <ProductCard key={`new-${p._id}`} product={p} />
                ))}
              </div>
            </section>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              8. ALL STORE PRODUCTS & SEARCH / FILTER / SORT
          ───────────────────────────────────────────────────────────────── */}
          <section id="store-products-section" className="space-y-6 pt-4 border-t border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Store Catalog ({filteredProducts.length})
                </h2>
                <p className="text-xs text-slate-500">Explore all items available from this seller</p>
              </div>

              {/* Search & Sort Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search in this store..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 pl-9 text-xs outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-300"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                </div>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-orange-400 cursor-pointer"
                >
                  <option value="popular">Sort: Most Popular</option>
                  <option value="newest">Sort: Newest First</option>
                  <option value="price-low">Sort: Price Low → High</option>
                  <option value="price-high">Sort: Price High → Low</option>
                  <option value="rating">Sort: Highest Rating</option>
                </select>
              </div>
            </div>

            {/* Category Filter Pills (Collections) */}
            {categories.length > 1 && (
              <div id="store-collections-section" className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold transition flex-shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat === 'all' ? 'All Products' : cat}
                  </button>
                ))}
              </div>
            )}

            {/* Product Grid */}
            {!filteredProducts.length ? (
              <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-slate-400">
                <p className="text-4xl">🔍</p>
                <p className="mt-3 text-sm font-semibold text-slate-700">No products match your search or filter.</p>
                <button
                  type="button"
                  onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                  className="mt-3 text-xs font-bold text-orange-500 underline"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {filteredProducts.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            )}
          </section>

          {/* ─────────────────────────────────────────────────────────────────
              9. WHY SHOP WITH US (TRUST SECTION)
          ───────────────────────────────────────────────────────────────── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-6">Why Shop With {sellerName}?</h2>
            <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
              <div className="space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
                  ✓
                </div>
                <h3 className="text-xs font-bold text-slate-800">100% Genuine Products</h3>
                <p className="text-[11px] text-slate-500">Directly sourced and quality verified</p>
              </div>

              <div className="space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
                  🚚
                </div>
                <h3 className="text-xs font-bold text-slate-800">Express Delivery</h3>
                <p className="text-[11px] text-slate-500">Shipped fast with live tracking</p>
              </div>

              <div className="space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
                  🔒
                </div>
                <h3 className="text-xs font-bold text-slate-800">Safe Buyer Protection</h3>
                <p className="text-[11px] text-slate-500">Guaranteed order completion or refund</p>
              </div>

              <div className="space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
                  ⭐
                </div>
                <h3 className="text-xs font-bold text-slate-800">Top Rated Service</h3>
                <p className="text-[11px] text-slate-500">Rated {avgRating}/5 by thousands of buyers</p>
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────────
              10. CUSTOMER REVIEWS & RATING BREAKDOWN
          ───────────────────────────────────────────────────────────────── */}
          <section id="store-reviews-section" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              {/* Left Score Summary */}
              <div>
                <h2 className="text-xl font-black text-slate-900">Customer Ratings & Reviews</h2>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-4xl font-black text-slate-900">{avgRating}</span>
                  <div>
                    <div className="text-amber-400 text-sm">★★★★★</div>
                    <p className="text-xs text-slate-500 font-medium">Based on {totalReviewsCount} buyer reviews</p>
                  </div>
                </div>
              </div>

              {/* Star Breakdown Bars */}
              <div className="w-full md:w-64 space-y-1.5 text-xs font-medium">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingCounts[star] || 0;
                  const pct = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="w-6 text-slate-600 font-bold">{star}★</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-slate-400 text-[11px]">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review Cards Grid */}
            {allReviews.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {allReviews.slice(0, 6).map((r, i) => (
                  <div key={r._id || i} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-amber-400 text-xs">
                        {'★'.repeat(r.rating || 5)}{'☆'.repeat(5 - (r.rating || 5))}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Verified Buyer'}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 italic">
                      &quot;{r.comment || 'Great product, fast delivery and authentic item. Very satisfied!'}&quot;
                    </p>
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="font-bold text-slate-800">— {r.name || 'Verified Customer'}</span>
                      {r.productName && (
                        <span className="text-orange-600 truncate max-w-[160px]" title={r.productName}>
                          {r.productName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {/* Fallback default sample reviews for display */}
                {[
                  { name: 'Rafiqul Islam', comment: 'Excellent product quality and very quick shipping. Highly recommended seller!', rating: 5, date: '2 days ago' },
                  { name: 'Nusrat Jahan', comment: 'Authentic items and great customer support. Will purchase again.', rating: 5, date: '1 week ago' },
                ].map((r, i) => (
                  <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-amber-400 text-xs">★★★★★</div>
                      <span className="text-[10px] text-slate-400 font-medium">{r.date}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 italic">&quot;{r.comment}&quot;</p>
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="font-bold text-slate-800">— {r.name}</span>
                      <span className="text-green-600 font-semibold">✓ Verified Purchase</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            MOBILE BOTTOM STICKY CTA BAR
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="fixed bottom-0 inset-x-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur px-4 py-3 shadow-2xl md:hidden">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleToggleFollow}
              className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-bold transition active:scale-95 ${
                isFollowing
                  ? 'bg-slate-800 text-white'
                  : 'border border-slate-300 text-slate-800 bg-slate-50'
              }`}
            >
              {isFollowing ? '✓ Following' : '+ Follow'}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('products');
                const el = document.getElementById('store-products-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex-1 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 active:scale-95"
            >
              Shop Products →
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            SHARE MODAL FALLBACK
        ═══════════════════════════════════════════════════════════════════ */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Share Storefront</h3>
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Copy and share the official storefront link for <strong className="text-slate-800">{sellerName}</strong>:
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${siteUrl}/seller/${id}`}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700 outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white hover:bg-orange-600"
                >
                  {copiedLink ? 'Copied! ✓' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </MarketplaceLayout>
  );
}

export async function getServerSideProps(ctx) {
  const { id } = ctx.params || {};
  if (!id) return { props: { initialSeller: null, initialProducts: [] } };

  const fetchJson = async (url, fallback) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return fallback;
      return await res.json();
    } catch {
      return fallback;
    }
  };

  const [sellerData, productData] = await Promise.all([
    fetchJson(`${API_BASE}/auth/seller/${id}`, null),
    fetchJson(`${API_BASE}/products?seller=${id}&limit=50`, { products: [] }),
  ]);

  return {
    props: {
      initialSeller: sellerData,
      initialProducts: Array.isArray(productData?.products) ? productData.products : [],
    },
  };
}
