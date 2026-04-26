import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import MarketplaceLayout from '../../components/MarketplaceLayout';
import ProductCard from '../../components/ProductCard';
import { useStore } from '../../components/StoreProvider';
import { resolveImageSrc, FALLBACK_IMAGE } from '../../utils/resolveImageSrc';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

export default function ProductDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { addToCart, toggleWishlist, token } = useStore();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [guestReviewForm, setGuestReviewForm] = useState({ name: '', email: '', phone: '', orderId: '', rating: 5, comment: '' });
  const [reviewMessage, setReviewMessage] = useState('');

  useEffect(() => {
    if (!id) return;

    fetch(`${API_BASE}/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        if (data?.category) {
          fetch(`${API_BASE}/products?category=${encodeURIComponent(data.category)}&limit=4`)
            .then((res) => res.json())
            .then((rel) => {
              const items = Array.isArray(rel.products) ? rel.products : [];
              setRelated(items.filter((p) => p._id !== data._id).slice(0, 4));
            })
            .catch(() => setRelated([]));
        }
      })
      .catch(() => setProduct(null));
  }, [id]);

  const submitReview = async (event) => {
    event.preventDefault();
    if (!token) {
      setReviewMessage('Please login to submit a review.');
      return;
    }

    try {
      const payload = token
        ? { rating: Number(reviewForm.rating), comment: reviewForm.comment }
        : {
            ...guestReviewForm,
            rating: Number(guestReviewForm.rating),
            comment: guestReviewForm.comment
          };

      const res = await fetch(`${API_BASE}/products/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Review submit failed');

      setReviewMessage(data.message || 'Review saved');
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      setProduct((prev) => ({ ...prev, rating: data.rating, numReviews: data.numReviews }));
      setReviewForm((prev) => ({ ...prev, comment: '' }));
    } catch (error) {
      setReviewMessage(error.message || 'Review submit failed');
    }
  };

  const effectivePrice = useMemo(() => Number(product?.discountPrice ?? product?.price ?? 0), [product]);

  if (!product) {
    return (
      <MarketplaceLayout>
        <main className="mx-auto max-w-7xl p-6">Loading product...</main>
      </MarketplaceLayout>
    );
  }

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-6">
        <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2 md:p-6">
          <div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <img
                src={resolveImageSrc(product.images?.[activeImage] || product.images?.[0])}
                alt={product.name}
                className="h-80 w-full object-cover transition duration-300 hover:scale-110"
                onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
              />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {(product.images?.length ? product.images : []).filter(Boolean).map((img, idx) => (
                <button key={img} type="button" onClick={() => setActiveImage(idx)} className={`overflow-hidden rounded-xl border ${activeImage === idx ? 'border-orange-500' : 'border-slate-200'}`}>
                  <img
                    src={resolveImageSrc(img)}
                    alt={`${product.name}-${idx + 1}`}
                    className="h-20 w-full object-cover"
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">{product.category || 'General'}</p>
            <h1 className="mt-2 text-2xl font-black md:text-3xl">{product.name}</h1>
            <p className="mt-2 text-sm text-amber-500">★ {Number(product.rating || 4.2).toFixed(1)} · {product.numReviews || 0} ratings</p>

            <div className="mt-4 flex items-end gap-3">
              <p className="text-3xl font-black text-orange-500">৳{effectivePrice.toFixed(0)}</p>
              {product.discountPrice && (
                <p className="text-sm text-slate-500 line-through">৳{Number(product.price).toFixed(0)}</p>
              )}
            </div>

            <p className="mt-4 text-sm text-slate-600">{product.description || 'No detailed description available.'}</p>

            <div className="mt-6 grid gap-2 text-sm">
              <p><span className="font-semibold">Brand:</span> {product.brand || 'OpenBazar Verified'}</p>
              <p><span className="font-semibold">Specifications:</span> {product.specifications || 'Premium quality, authentic seller listing.'}</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => addToCart(product, 1)} className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600">Add to Cart</button>
              <button type="button" onClick={() => { addToCart(product, 1); router.push('/checkout'); }} className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700">Buy Now</button>
              <button type="button" onClick={() => toggleWishlist(product)} className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold hover:bg-slate-100">Add to Wishlist</button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold">Reviews</h2>

          <form onSubmit={submitReview} className="mt-3 rounded-xl border border-slate-200 p-3">
            <p className="mb-2 text-sm font-semibold">Write a review</p>
            {token ? (
              <div className="grid gap-2 md:grid-cols-[120px_1fr]">
                <select className="input" value={reviewForm.rating} onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: e.target.value }))}>
                  <option value={5}>5 ★</option>
                  <option value={4}>4 ★</option>
                  <option value={3}>3 ★</option>
                  <option value={2}>2 ★</option>
                  <option value={1}>1 ★</option>
                </select>
                <input className="input" value={reviewForm.comment} onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))} placeholder="Share your experience" maxLength={300} />
              </div>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                <input className="input" placeholder="Your Name" value={guestReviewForm.name} onChange={(e) => setGuestReviewForm((prev) => ({ ...prev, name: e.target.value }))} required />
                <input className="input" placeholder="Order ID" value={guestReviewForm.orderId} onChange={(e) => setGuestReviewForm((prev) => ({ ...prev, orderId: e.target.value }))} required />
                <input className="input" type="email" placeholder="Email" value={guestReviewForm.email} onChange={(e) => setGuestReviewForm((prev) => ({ ...prev, email: e.target.value }))} required />
                <input className="input" placeholder="Phone Number" value={guestReviewForm.phone} onChange={(e) => setGuestReviewForm((prev) => ({ ...prev, phone: e.target.value }))} required />
                <select className="input" value={guestReviewForm.rating} onChange={(e) => setGuestReviewForm((prev) => ({ ...prev, rating: e.target.value }))}>
                  <option value={5}>5 ★</option>
                  <option value={4}>4 ★</option>
                  <option value={3}>3 ★</option>
                  <option value={2}>2 ★</option>
                  <option value={1}>1 ★</option>
                </select>
                <input className="input" value={guestReviewForm.comment} onChange={(e) => setGuestReviewForm((prev) => ({ ...prev, comment: e.target.value }))} placeholder="Share your experience" maxLength={300} />
              </div>
            )}
            <div className="mt-2 flex items-center gap-3">
              <button type="submit" className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600">Submit Review</button>
              {reviewMessage && <p className="text-xs text-slate-500">{reviewMessage}</p>}
            </div>
          </form>

          <div className="mt-4 space-y-2 text-sm text-slate-700">
            {!reviews.length ? (
              <p className="text-slate-500">No reviews yet. Be the first reviewer.</p>
            ) : (
              reviews.slice().reverse().map((rev) => (
                <article key={rev._id || `${rev.user}-${rev.createdAt}`} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-semibold">{rev.name || 'Customer'}</p>
                  <p className="text-amber-500">{'★'.repeat(Number(rev.rating || 0))}</p>
                  <p className="mt-1 text-slate-600">{rev.comment || 'No comment provided.'}</p>
                </article>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold">Related Products</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => <ProductCard key={item._id} product={item} />)}
          </div>
        </section>
      </main>
    </MarketplaceLayout>
  );
}
