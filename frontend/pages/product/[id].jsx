import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import MarketplaceLayout from '../../components/MarketplaceLayout';
import ProductCard from '../../components/ProductCard';
import { useStore } from '../../components/StoreProvider';
import { resolveImageSrc } from '../../utils/resolveImageSrc';
import VerifiedBadge from '../../components/VerifiedBadge';
import SmartImage from '../../components/SmartImage';
import SEO from '../../components/SEO';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

function getSiteUrl() {
  const base = process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://open-bazar.me';
  return base.replace(/\/$/, '');
}

function StarRatingInput({ value, onChange }) {
  return (
    <div className="flex gap-1.5 items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-2xl transition transform hover:scale-125 ${
            star <= value ? 'text-amber-400' : 'text-slate-200'
          }`}
        >
          ★
        </button>
      ))}
      <span className="ml-2 text-xs font-bold text-slate-600">
        {value === 5 ? 'Exceptional 5/5' : value === 4 ? 'Good 4/5' : value === 3 ? 'Average 3/5' : `${value}/5 Stars`}
      </span>
    </div>
  );
}

export default function ProductDetails({ initialProduct = null, initialRelated = [] }) {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart, toggleWishlist, wishlist, token, openCartDrawer } = useStore();

  const [product, setProduct] = useState(initialProduct);
  const [related, setRelated] = useState(initialRelated);
  const [activeImage, setActiveImage] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [guestReviewForm, setGuestReviewForm] = useState({ name: '', email: '', phone: '', orderId: '', rating: 5, comment: '' });
  const [reviewMessage, setReviewMessage] = useState('');
  const [showShareNotification, setShowShareNotification] = useState(false);

  // Variant selections
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedWeight, setSelectedWeight] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const inWishlist = useMemo(() => wishlist.some((w) => w._id === id), [wishlist, id]);

  useEffect(() => {
    if (!id) return;
    setSelectedColor('');
    setSelectedSize('');
    setSelectedWeight('');
    setQuantity(1);

    if (initialProduct && String(initialProduct?._id || '') === String(id)) {
      return;
    }

    fetch(`${API_BASE}/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct(data);
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        try {
          const prev = JSON.parse(localStorage.getItem('ob_recently_viewed') || '[]');
          const filtered = prev.filter((p) => p._id !== data._id);
          const entry = { _id: data._id, name: data.name, images: data.images, photos: data.photos, price: data.price, discountPrice: data.discountPrice };
          localStorage.setItem('ob_recently_viewed', JSON.stringify([entry, ...filtered].slice(0, 10)));
        } catch { /* ignore */ }

        if (data?.category) {
          fetch(`${API_BASE}/products?category=${encodeURIComponent(data.category)}&limit=5`)
            .then((r) => r.json())
            .then((rel) => {
              const items = Array.isArray(rel.products) ? rel.products : [];
              setRelated(items.filter((p) => p._id !== data._id).slice(0, 4));
            }).catch(() => setRelated([]));
        }
      }).catch(() => setProduct(null));
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      const payload = token
        ? { rating: Number(reviewForm.rating), comment: reviewForm.comment }
        : { ...guestReviewForm, rating: Number(guestReviewForm.rating) };

      const res = await fetch(`${API_BASE}/products/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit review');
      setReviewMessage(data.message || 'Thank you! Review submitted successfully ✓');
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      setProduct((p) => ({ ...p, rating: data.rating, numReviews: data.numReviews }));
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      setReviewMessage(err.message || 'Failed to post review');
    }
  };

  const images = (product?.images?.length ? product.images : product?.photos || []).filter(Boolean);
  const colors = product?.colors?.filter(Boolean) || [];
  const sizes = product?.sizes?.filter(Boolean) || [];
  const weightPrices = Array.isArray(product?.weightPrices) ? product.weightPrices : [];

  // Determine effective unit price based on weight selection
  const basePrice = Number(product?.discountPrice ?? product?.price ?? 0);
  const effectivePrice = useMemo(() => {
    if (selectedWeight && weightPrices.length > 0) {
      const match = weightPrices.find((w) => w.weight === selectedWeight);
      if (match && Number(match.price) > 0) return Number(match.price);
    }
    return basePrice;
  }, [selectedWeight, weightPrices, basePrice]);

  const originalPrice = Number(product?.price || 0);
  const hasDiscount = originalPrice > effectivePrice;
  const savingsAmount = hasDiscount ? originalPrice - effectivePrice : 0;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100) : 0;

  const stockLeft = Number(product?.stock ?? 9999);
  const isOutOfStock = stockLeft <= 0;
  const maxQty = Math.min(stockLeft, 10);

  const handleAddToCart = (buyNow = false) => {
    if (!product || isOutOfStock) return;
    
    addToCart({
      ...product,
      selectedColor,
      selectedSize,
      selectedWeight,
      unitPrice: effectivePrice
    }, quantity, !buyNow);

    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);

    if (buyNow) {
      router.push('/checkout');
    }
  };

  const shareProduct = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      navigator.share({ title: product.name, url });
    } else {
      navigator.clipboard?.writeText(url);
      setShowShareNotification(true);
      setTimeout(() => setShowShareNotification(false), 2000);
    }
  };

  const siteUrl = getSiteUrl();
  const canonical = product?._id ? `${siteUrl}/product/${product._id}` : `${siteUrl}/product/${id || ''}`;
  const title = product ? `${product.name} — Buy Online on OpenBazar` : 'Product Details';
  const description = product?.description
    ? String(product.description).slice(0, 160)
    : 'Shop genuine products with verified seller protection, cash on delivery, and express shipping in Bangladesh.';
  const ogImage = resolveImageSrc(images?.[0]);

  if (!product) {
    return (
      <MarketplaceLayout>
        <SEO title="Loading product" description="Loading product details on OpenBazar." canonical={`${siteUrl}/product/${id || ''}`} noindex />
        <main className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="mx-auto h-12 w-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-500">Loading product experience...</p>
        </main>
      </MarketplaceLayout>
    );
  }

  return (
    <MarketplaceLayout>
      <SEO
        title={title}
        description={description}
        canonical={canonical}
        image={ogImage}
        type="product"
      />

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-6">

        {/* ── Breadcrumb Bar ── */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-indigo-600 transition">Home</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link href={`/category?category=${encodeURIComponent(product.category)}`} className="hover:text-indigo-600 transition">
                {product.category}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="truncate max-w-[200px] sm:max-w-md text-slate-800 font-bold">{product.name}</span>
        </nav>

        {/* ── Main Showcase Grid ── */}
        <section className="grid gap-8 lg:grid-cols-12 items-start">

          {/* LEFT: Sticky Media Gallery (7 cols) */}
          <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-24">
            {/* Primary Main Image Frame */}
            <div className="relative aspect-square md:aspect-[4/3] w-full overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm">
              <SmartImage
                src={resolveImageSrc(images[activeImage] || images[0])}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-contain transition-all duration-300 hover:scale-105"
              />

              {/* Discount Tag Overlay */}
              {hasDiscount && (
                <div className="absolute left-4 top-4 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-3 py-1.5 text-xs font-black text-white shadow-md shadow-rose-500/25">
                  <span>🔥</span>
                  <span>SAVE {discountPercent}%</span>
                </div>
              )}

              {/* Wishlist & Share Floating Buttons */}
              <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md shadow-md transition-all duration-200 ${
                    inWishlist
                      ? 'bg-rose-500 text-white shadow-rose-500/30 scale-105'
                      : 'bg-white/90 text-slate-600 hover:bg-white hover:text-rose-500 hover:scale-110'
                  }`}
                  title={inWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
                >
                  <span className="text-lg leading-none">{inWishlist ? '♥' : '♡'}</span>
                </button>

                <button
                  type="button"
                  onClick={shareProduct}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-600 backdrop-blur-md shadow-md hover:bg-white hover:text-indigo-600 hover:scale-110 transition"
                  title="Share product link"
                >
                  <span>↗</span>
                </button>
              </div>

              {showShareNotification && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/90 text-white px-4 py-1.5 text-xs font-bold shadow-lg animate-fade-in">
                  🔗 Link copied to clipboard!
                </div>
              )}
            </div>

            {/* Multi-angle thumbnail row */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 bg-white transition-all ${
                      activeImage === idx
                        ? 'border-indigo-600 shadow-md shadow-indigo-500/20 scale-105'
                        : 'border-slate-200/80 hover:border-indigo-300 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <SmartImage
                      src={resolveImageSrc(img)}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Purchase Decision Box (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-5">
              
              {/* Header Details */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-full bg-indigo-50 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-indigo-600">
                    {product.category || 'Marketplace Item'}
                  </span>
                  {product.brand && (
                    <span className="text-xs font-semibold text-slate-500">
                      Brand: <strong className="text-slate-800">{product.brand}</strong>
                    </span>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 leading-tight">
                  {product.name}
                </h1>

                {/* Rating summary */}
                <div className="mt-2.5 flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 text-amber-400">
                    {'★'.repeat(Math.round(product.rating || 5))}
                  </div>
                  <span className="font-extrabold text-slate-800">{Number(product.rating || 4.5).toFixed(1)}</span>
                  <span className="text-slate-400">({product.numReviews || 0} customer reviews)</span>
                  {product.soldCount > 0 && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="text-emerald-600 font-bold">🔥 {product.soldCount} sold</span>
                    </>
                  )}
                </div>
              </div>

              {/* Price & Savings Block */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/30 p-4 border border-slate-100">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl md:text-4xl font-black text-slate-900">
                    ৳{effectivePrice.toFixed(0)}
                  </span>
                  {hasDiscount && (
                    <span className="text-base font-semibold text-slate-400 line-through">
                      ৳{originalPrice.toFixed(0)}
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800">
                      Save ৳{savingsAmount.toFixed(0)}
                    </span>
                  )}
                </div>

                {/* Stock status indicator */}
                <div className="mt-2.5 flex items-center gap-2 text-xs">
                  {isOutOfStock ? (
                    <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                      <span>✕</span> Out of Stock
                    </span>
                  ) : stockLeft <= 5 ? (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                      <span>⚡</span> Only {stockLeft} units left in stock — order soon!
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                      <span>✓</span> In Stock & Ready to Ship
                    </span>
                  )}
                </div>
              </div>

              {/* Variants Selector */}
              <div className="space-y-4 pt-1">
                {/* Weight selection */}
                {weightPrices.length > 0 && (
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                      Weight Option: <span className="text-indigo-600">{selectedWeight || 'Select'}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {weightPrices.map((item) => (
                        <button
                          key={item.weight}
                          type="button"
                          onClick={() => setSelectedWeight(item.weight)}
                          className={`rounded-xl border-2 px-3.5 py-2 text-xs font-bold transition-all ${
                            selectedWeight === item.weight
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span>{item.weight}</span>
                          <span className="ml-1.5 text-slate-400">৳{Number(item.price).toFixed(0)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Colors */}
                {colors.length > 0 && (
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                      Color: <span className="text-indigo-600">{selectedColor || 'Choose a color'}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setSelectedColor(c)}
                          className={`rounded-xl border-2 px-3.5 py-2 text-xs font-bold transition-all ${
                            selectedColor === c
                              ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sizes */}
                {sizes.length > 0 && (
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                      Size: <span className="text-indigo-600">{selectedSize || 'Choose a size'}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSelectedSize(s)}
                          className={`min-w-[44px] rounded-xl border-2 px-3 py-2 text-xs font-bold transition-all ${
                            selectedSize === s
                              ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Stepper */}
                {!isOutOfStock && (
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                      Quantity
                    </label>
                    <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-sm">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-base font-bold text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-40 transition"
                      >
                        −
                      </button>
                      <span className="w-12 text-center text-sm font-black text-slate-900">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                        disabled={quantity >= maxQty}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-base font-bold text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-40 transition"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2.5">
                {!isOutOfStock ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(false)}
                      className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 px-6 text-sm font-black transition-all duration-200 shadow-md ${
                        addedSuccess
                          ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                          : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.99]'
                      }`}
                    >
                      <span>{addedSuccess ? '✓' : '🛒'}</span>
                      <span>{addedSuccess ? 'Added to Bag!' : 'Add to Shopping Bag'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-950 py-3.5 px-6 text-sm font-black text-white hover:bg-slate-800 active:scale-[0.99] transition duration-200 shadow-sm"
                    >
                      <span>⚡ Buy Now with 1-Click</span>
                    </button>
                  </>
                ) : (
                  <button
                    disabled
                    className="w-full rounded-2xl bg-slate-200 py-3.5 text-sm font-bold text-slate-400 cursor-not-allowed"
                  >
                    Out of Stock
                  </button>
                )}
              </div>

              {/* Nationwide Delivery Benefits Card */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="text-base">🚚</span>
                  <div>
                    <p className="font-extrabold text-slate-800">Nationwide Express Delivery</p>
                    <p className="text-slate-500">Dhaka: ৳70 (24h) · Outside: ৳120 (48-72h) · <strong>Free on 4+ items</strong></p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-base">🛡️</span>
                  <div>
                    <p className="font-extrabold text-slate-800">100% Genuine Guaranteed</p>
                    <p className="text-slate-500">Direct from verified marketplace merchant with 3-day easy replacement.</p>
                  </div>
                </div>
              </div>

              {/* Seller Profile Card */}
              {product.seller && (
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 to-blue-50/40 p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
                      {(product.seller?.sellerApplication?.storeName || product.seller?.name || 'S')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 font-bold text-xs text-slate-900">
                        <span>{product.seller?.sellerApplication?.storeName || product.seller?.name || 'Verified Seller'}</span>
                        {(product.seller?.isSellerVerifiedBadge || product.seller?.isVerified) && (
                          <VerifiedBadge className="h-3.5 w-3.5 inline text-indigo-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">⭐ Top Merchant · Fast Dispatch</p>
                    </div>
                  </div>

                  <Link
                    href={`/seller/${product.seller?._id || product.seller}`}
                    className="rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition"
                  >
                    View Store
                  </Link>
                </div>
              )}

            </div>
          </div>
        </section>

        {/* ── Product Specifications & Description ── */}
        <section className="rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Product Overview & Specs</h2>
            <div className="mt-4 prose max-w-none text-slate-600 text-sm leading-relaxed whitespace-pre-line">
              {product.description || 'No detailed description available.'}
            </div>
          </div>

          {product.specifications && (
            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 mb-3">
                Technical Specifications
              </h3>
              <div className="rounded-2xl bg-slate-50 p-4 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                {product.specifications}
              </div>
            </div>
          )}
        </section>

        {/* ── Reviews Section ── */}
        <section className="rounded-3xl border border-slate-200/90 bg-white p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-black text-slate-900">Verified Customer Reviews</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real feedback from verified shoppers</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-900">{Number(product.rating || 4.5).toFixed(1)}</span>
              <div className="text-amber-400 text-sm">{'★'.repeat(Math.round(product.rating || 5))}</div>
              <span className="text-xs text-slate-400 font-semibold">({product.numReviews || 0} reviews)</span>
            </div>
          </div>

          {/* Write a review form */}
          <form onSubmit={submitReview} className="rounded-2xl bg-slate-50/80 p-5 border border-slate-200/70 space-y-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-2">Your Rating</p>
              <StarRatingInput
                value={Number(token ? reviewForm.rating : guestReviewForm.rating)}
                onChange={(v) => token
                  ? setReviewForm((p) => ({ ...p, rating: v }))
                  : setGuestReviewForm((p) => ({ ...p, rating: v }))}
              />
            </div>

            {!token && (
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500"
                  placeholder="Your Name"
                  value={guestReviewForm.name}
                  onChange={(e) => setGuestReviewForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
                <input
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500"
                  placeholder="Order ID"
                  value={guestReviewForm.orderId}
                  onChange={(e) => setGuestReviewForm((p) => ({ ...p, orderId: e.target.value }))}
                  required
                />
                <input
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500"
                  type="email"
                  placeholder="Email Address"
                  value={guestReviewForm.email}
                  onChange={(e) => setGuestReviewForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
                <input
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500"
                  placeholder="Phone Number (Optional)"
                  value={guestReviewForm.phone}
                  onChange={(e) => setGuestReviewForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
            )}

            <textarea
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none focus:border-indigo-500 min-h-[90px]"
              value={token ? reviewForm.comment : guestReviewForm.comment}
              onChange={(e) => token
                ? setReviewForm((p) => ({ ...p, comment: e.target.value }))
                : setGuestReviewForm((p) => ({ ...p, comment: e.target.value }))}
              placeholder="What did you like or dislike about this product? Write your genuine experience..."
              maxLength={400}
            />

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:from-blue-700 hover:to-indigo-700 transition"
              >
                Post Review
              </button>
              {reviewMessage && (
                <p className="text-xs font-semibold text-emerald-600">{reviewMessage}</p>
              )}
            </div>
          </form>

          {/* Review items */}
          <div className="divide-y divide-slate-100">
            {!reviews.length ? (
              <p className="py-6 text-center text-xs font-semibold text-slate-400">
                No customer reviews yet. Be the first to share your thoughts!
              </p>
            ) : (
              reviews.slice().reverse().map((rev, i) => (
                <div key={i} className="py-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900">{rev.name || 'Verified Buyer'}</span>
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        ✓ Verified Purchase
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>

                  <div className="flex text-amber-400 text-xs">
                    {'★'.repeat(Number(rev.rating || 5))}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {rev.comment || 'No written comment.'}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── Related Recommendations ── */}
        {related.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">You May Also Like</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => <ProductCard key={item._id} product={item} />)}
            </div>
          </section>
        )}

      </main>

      {/* ── Floating Mobile Sticky Buy Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 bg-white/95 backdrop-blur-md p-3 shadow-2xl md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Price</p>
            <p className="text-lg font-black text-slate-900">৳{effectivePrice.toFixed(0)}</p>
          </div>

          <div className="flex gap-2 flex-1 max-w-[240px]">
            <button
              type="button"
              onClick={() => handleAddToCart(false)}
              disabled={isOutOfStock}
              className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-black text-slate-800 hover:bg-slate-200 transition"
            >
              Add to Bag
            </button>
            <button
              type="button"
              onClick={() => handleAddToCart(true)}
              disabled={isOutOfStock}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-xs font-black text-white shadow-md transition"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </MarketplaceLayout>
  );
}

export async function getServerSideProps(ctx) {
  const { id } = ctx.params || {};
  if (!id) return { props: { initialProduct: null, initialRelated: [] } };

  const fetchJson = async (url, fallback) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return fallback;
      return await res.json();
    } catch {
      return fallback;
    }
  };

  const product = await fetchJson(`${API_BASE}/products/${id}`, null);

  let related = [];
  if (product?.category) {
    const rel = await fetchJson(`${API_BASE}/products?category=${encodeURIComponent(product.category)}&limit=5`, { products: [] });
    const items = Array.isArray(rel?.products) ? rel.products : [];
    related = items.filter((p) => p && p._id && p._id !== product._id).slice(0, 4);
  }

  if (ctx.res) {
    ctx.res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  }

  return {
    props: {
      initialProduct: product,
      initialRelated: related,
    }
  };
}
