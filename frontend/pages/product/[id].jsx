import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import MarketplaceLayout from '../../components/MarketplaceLayout';
import ProductCard from '../../components/ProductCard';
import { useStore } from '../../components/StoreProvider';
import { resolveImageSrc, FALLBACK_IMAGE } from '../../utils/resolveImageSrc';
import VerifiedBadge from '../../components/VerifiedBadge';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)}
          className={`text-2xl transition ${star <= value ? 'text-amber-400' : 'text-slate-200'}`}>
          ★
        </button>
      ))}
    </div>
  );
}

export default function ProductDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart, toggleWishlist, wishlist, token } = useStore();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [guestReviewForm, setGuestReviewForm] = useState({ name: '', email: '', phone: '', orderId: '', rating: 5, comment: '' });
  const [reviewMessage, setReviewMessage] = useState('');

  // Variant selections
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState('');
  const [addedMsg, setAddedMsg] = useState('');

  const inWishlist = useMemo(() => wishlist.some((w) => w._id === id), [wishlist, id]);

  useEffect(() => {
    if (!id) return;
    setSelectedColor(''); setSelectedSize(''); setQuantity(1);

    fetch(`${API_BASE}/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct(data);
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        // Track recently viewed
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
      if (!res.ok) throw new Error(data.message);
      setReviewMessage(data.message || 'Review saved ✓');
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      setProduct((p) => ({ ...p, rating: data.rating, numReviews: data.numReviews }));
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) { setReviewMessage(err.message || 'Failed'); }
  };

  const handleAddToCart = (buyNow = false) => {
    if (!product) return;
    if (product.category === 'Mango' && !selectedWeight) {
      setAddedMsg('⚠️ Please select a weight');
      setTimeout(() => setAddedMsg(''), 2000);
      return;
    }
    const selectedWeightData = product.category === 'Mango' 
      ? product.weightPrices.find(wp => wp.weight === selectedWeight)
      : null;
    
    // Calculate effective unit price for cart
    let unitPrice = weightPrice ?? (product.discountPrice ?? product.price);
    
    // If it's a mango and we have a discount on the base product, apply it to the weight price too?
    // Actually, usually manual pricing per weight is final, but if the user wants "dashboard options with discount":
    if (product.category === 'Mango' && weightPrice && product.salePercent > 0) {
      unitPrice = Number((weightPrice * (1 - product.salePercent / 100)).toFixed(2));
    }
    
    addToCart({ 
      ...product, 
      selectedColor, 
      selectedSize, 
      selectedWeight,
      unitPrice
    }, quantity);
    setAddedMsg('✓ Added to cart!');
    setTimeout(() => setAddedMsg(''), 2000);
    if (buyNow) router.push('/checkout');
  };

  const effectivePrice = useMemo(() => Number(product?.discountPrice ?? product?.price ?? 0), [product]);
  const stockLeft = Number(product?.stock ?? 9999);
  const isOutOfStock = stockLeft <= 0;
  const maxQty = Math.min(stockLeft, 10);

  const images = (product?.images?.length ? product.images : product?.photos || []).filter(Boolean);
  const colors = product?.colors?.filter(Boolean) || [];
  const sizes = product?.sizes?.filter(Boolean) || [];

  if (!product) return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-7xl p-10 text-center text-slate-400 animate-pulse">Loading product...</main>
    </MarketplaceLayout>
  );

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-6">

        {/* ── Main product card ── */}
        <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 md:p-6">

          {/* Gallery */}
          <div>
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
              <img
                src={resolveImageSrc(images[activeImage] || images[0])}
                alt={product.name}
                className="h-80 w-full object-contain transition duration-300 hover:scale-105"
                onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
              />
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setActiveImage(idx)}
                    className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition ${activeImage === idx ? 'border-orange-500' : 'border-slate-200'}`}>
                    <img src={resolveImageSrc(img)} alt="" className="h-full w-full object-cover"
                      onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">{product.category}</p>
            <h1 className="mt-1 text-2xl font-black text-slate-800 md:text-3xl">{product.name}</h1>

            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-amber-400">{'★'.repeat(Math.round(product.rating || 4))}</span>
              <span className="text-slate-500">{Number(product.rating || 4.2).toFixed(1)} · {product.numReviews || 0} reviews</span>
              
              {product.seller && (
                <>
                  <span className="text-slate-300">|</span>
                  <Link href={`/seller/${product.seller?._id || product.seller}`} className="flex items-center gap-1 font-semibold text-slate-700 hover:text-orange-500">
                    {product.seller?.sellerApplication?.storeName || product.seller?.name || 'Seller'}
                    {(product.seller?.isSellerVerifiedBadge || product.seller?.isVerified) && (
                      <VerifiedBadge className="h-4 w-4" />
                    )}
                  </Link>
                </>
              )}
            </div>

            {/* Price */}
            <div className="mt-4 flex items-end gap-3">
              <div className="flex flex-col">
                <p className="text-4xl font-black text-orange-500">
                  ৳{product.category === 'Mango' && selectedWeight 
                    ? (product.salePercent > 0 
                        ? (Number(product.weightPrices.find(wp => wp.weight === selectedWeight)?.price || 0) * (1 - product.salePercent / 100)).toFixed(0)
                        : Number(product.weightPrices.find(wp => wp.weight === selectedWeight)?.price || 0).toFixed(0))
                    : effectivePrice.toFixed(0)}
                  {product.category === 'Mango' && !selectedWeight && <span className="text-sm font-normal text-slate-400 ml-2">(Select weight)</span>}
                </p>
                {product.category === 'Mango' && selectedWeight && product.salePercent > 0 && (
                  <p className="text-sm text-slate-400 line-through">
                    ৳{Number(product.weightPrices.find(wp => wp.weight === selectedWeight)?.price || 0).toFixed(0)}
                  </p>
                )}
              </div>
              {product.salePercent > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600 mb-1">
                  {product.salePercent}% OFF
                </span>
              )}
            </div>

            {/* Stock badge */}
            <div className="mt-2">
              {isOutOfStock ? (
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600">Out of Stock</span>
              ) : stockLeft < 10 ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-600">Only {stockLeft} left!</span>
              ) : (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-600">In Stock</span>
              )}
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-600">{product.description}</p>

            {/* Color selector */}
            {product.category === 'Mango' && product.weightPrices?.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold text-orange-700 font-bold uppercase tracking-wide">Select Weight</p>
                <div className="flex flex-wrap gap-2">
                  {product.weightPrices.map((wp) => (
                    <button key={wp.weight} onClick={() => setSelectedWeight(wp.weight)}
                      className={`rounded-xl border-2 px-4 py-2 text-sm font-black transition ${selectedWeight === wp.weight ? 'border-orange-500 bg-orange-500 text-white shadow-lg' : 'border-slate-200 bg-white hover:border-orange-300'}`}>
                      {wp.weight} - ৳{Number(wp.price).toFixed(0)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {colors.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold">Color: <span className="text-orange-500">{selectedColor || 'Select'}</span></p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button key={c} onClick={() => setSelectedColor(c)}
                      className={`rounded-lg border-2 px-3 py-1.5 text-xs font-semibold transition ${selectedColor === c ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 hover:border-orange-300'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size selector */}
            {sizes.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold">Size: <span className="text-orange-500">{selectedSize || 'Select'}</span></p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button key={s} onClick={() => setSelectedSize(s)}
                      className={`h-9 min-w-[2.5rem] rounded-lg border-2 px-3 text-xs font-bold transition ${selectedSize === s ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-200 hover:border-orange-300'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity stepper */}
            {!isOutOfStock && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold">Quantity</p>
                <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-200">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-4 py-2 text-lg font-bold hover:bg-slate-100 disabled:opacity-40" disabled={quantity <= 1}>−</button>
                  <span className="min-w-[2.5rem] px-2 text-center font-bold">{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                    className="px-4 py-2 text-lg font-bold hover:bg-slate-100 disabled:opacity-40" disabled={quantity >= maxQty}>+</button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-3">
              {!isOutOfStock ? (
                <>
                  <button onClick={() => handleAddToCart(false)} disabled={!!addedMsg}
                    className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:bg-orange-400">
                    {addedMsg || '🛒 Add to Cart'}
                  </button>
                  <button onClick={() => handleAddToCart(true)}
                    className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700">
                    ⚡ Buy Now
                  </button>
                </>
              ) : (
                <button disabled className="rounded-xl bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-400">
                  Out of Stock
                </button>
              )}
              <button onClick={() => toggleWishlist(product)}
                className={`rounded-xl border px-6 py-3 text-sm font-semibold transition ${inWishlist ? 'border-red-300 bg-red-50 text-red-600' : 'border-slate-200 hover:bg-slate-100'}`}>
                {inWishlist ? '❤️ Wishlisted' : '🤍 Wishlist'}
              </button>
              <button
                onClick={() => {
                  const url = typeof window !== 'undefined' ? window.location.href : '';
                  if (navigator.share) { navigator.share({ title: product.name, url }); }
                  else { navigator.clipboard?.writeText(url); setAddedMsg('🔗 Link copied!'); setTimeout(() => setAddedMsg(''), 2000); }
                }}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm hover:bg-slate-100" title="Share">
                📤
              </button>
            </div>

            {/* Specs */}
            {product.specifications && (
              <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                <p className="mb-1 font-semibold text-slate-700">Specifications</p>
                <p className="whitespace-pre-wrap">{product.specifications}</p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
              <span>Brand: {product.brand}</span>
              <span>·</span>
              <span>{product.soldCount || 0} sold</span>
            </div>
          </div>
        </section>

        {/* ── Reviews ── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold">Customer Reviews ({product.numReviews || 0})</h2>

          <form onSubmit={submitReview} className="mt-4 rounded-xl border border-slate-200 p-4">
            <p className="mb-3 text-sm font-semibold">Write a Review</p>
            <StarRating value={Number(token ? reviewForm.rating : guestReviewForm.rating)}
              onChange={(v) => token
                ? setReviewForm((p) => ({ ...p, rating: v }))
                : setGuestReviewForm((p) => ({ ...p, rating: v }))} />

            {!token && (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <input className="input" placeholder="Your Name" value={guestReviewForm.name} onChange={(e) => setGuestReviewForm((p) => ({ ...p, name: e.target.value }))} required />
                <input className="input" placeholder="Order ID" value={guestReviewForm.orderId} onChange={(e) => setGuestReviewForm((p) => ({ ...p, orderId: e.target.value }))} required />
                <input className="input" type="email" placeholder="Email" value={guestReviewForm.email} onChange={(e) => setGuestReviewForm((p) => ({ ...p, email: e.target.value }))} required />
                <input className="input" placeholder="Phone" value={guestReviewForm.phone} onChange={(e) => setGuestReviewForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
            )}

            <textarea className="input mt-3 min-h-[80px]"
              value={token ? reviewForm.comment : guestReviewForm.comment}
              onChange={(e) => token
                ? setReviewForm((p) => ({ ...p, comment: e.target.value }))
                : setGuestReviewForm((p) => ({ ...p, comment: e.target.value }))}
              placeholder="Share your experience..." maxLength={300} />

            <div className="mt-3 flex items-center gap-3">
              <button type="submit" className="rounded-lg bg-orange-500 px-5 py-2 text-xs font-bold text-white hover:bg-orange-600">
                Submit Review
              </button>
              {reviewMessage && <p className="text-xs text-green-600">{reviewMessage}</p>}
            </div>
          </form>

          <div className="mt-4 space-y-3">
            {!reviews.length ? (
              <p className="text-sm text-slate-400">No reviews yet. Be the first!</p>
            ) : (
              reviews.slice().reverse().map((rev, i) => (
                <article key={i} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-700">{rev.name || 'Customer'}</p>
                      <p className="text-amber-400">{'★'.repeat(Number(rev.rating || 0))}{'☆'.repeat(5 - Number(rev.rating || 0))}</p>
                    </div>
                    <p className="text-xs text-slate-400">{rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : ''}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{rev.comment || 'No comment.'}</p>
                </article>
              ))
            )}
          </div>
        </section>

        {/* ── Related products ── */}
        {related.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-bold">You May Also Like</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => <ProductCard key={item._id} product={item} />)}
            </div>
          </section>
        )}
      </main>
    </MarketplaceLayout>
  );
}
