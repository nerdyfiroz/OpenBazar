import Link from 'next/link';
import { useState } from 'react';
import { useStore } from './StoreProvider';
import { resolveImageSrc } from '../utils/resolveImageSrc';
import VerifiedBadge from './VerifiedBadge';
import SmartImage from './SmartImage';

function extractImages(product) {
  const list = [];
  const add = (val) => {
    if (!val) return;
    if (Array.isArray(val)) {
      val.forEach((x) => {
        if (typeof x === 'string' && x.trim()) list.push(x.trim());
        else if (typeof x === 'object' && x?.url) list.push(x.url.trim());
      });
    } else if (typeof val === 'string') {
      val.split(',').forEach((x) => x.trim() && list.push(x.trim()));
    } else if (typeof val === 'object' && val?.url) {
      list.push(val.url.trim());
    }
  };

  add(product?.images);
  add(product?.photos);
  add(product?.image);
  add(product?.photoUrl);
  add(product?.thumbnail);

  return list.length ? list : ['/placeholder.png'];
}

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const [isHovered, setIsHovered] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const isWished = wishlist.some((item) => item._id === product._id);
  const hasDiscount = Number(product.discountPrice) > 0 && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const images = extractImages(product);
  const primaryImg = resolveImageSrc(images[0]);
  const secondaryImg = images.length > 1 ? resolveImageSrc(images[1]) : primaryImg;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1, true);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300/80 hover:shadow-[0_16px_32px_rgba(99,102,241,0.12)]"
    >
      {/* ── Top Image Container ── */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-50 border border-slate-100">
        <Link href={`/product/${product._id}`} className="block h-full w-full">
          {/* Primary image */}
          <SmartImage
            src={isHovered && images.length > 1 ? secondaryImg : primaryImg}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-all duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-2.5 py-1 text-[11px] font-black text-white shadow-md shadow-rose-500/20">
            <span>🔥</span>
            <span>-{discountPercent}%</span>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlist}
          className={`absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 shadow-sm ${
            isWished
              ? 'bg-rose-500 text-white shadow-rose-500/30 scale-105'
              : 'bg-white/80 text-slate-500 hover:bg-white hover:text-rose-500 hover:scale-110'
          }`}
          title={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <span className="text-sm leading-none">{isWished ? '♥' : '♡'}</span>
        </button>

        {/* Stock Badge if Low */}
        {product.stock > 0 && product.stock <= 5 && (
          <div className="absolute bottom-2 left-2 z-10 rounded-md bg-amber-500/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
            Only {product.stock} left
          </div>
        )}
      </div>

      {/* ── Product Info ── */}
      <div className="mt-3 flex flex-1 flex-col justify-between space-y-2.5">
        <div>
          {/* Seller Tag */}
          {product.seller && (
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 mb-1">
              <span className="truncate max-w-[130px]" title={product.seller?.sellerApplication?.storeName || product.seller?.name}>
                {product.seller?.sellerApplication?.storeName || product.seller?.name}
              </span>
              {(product.seller?.isSellerVerifiedBadge || product.seller?.isVerified) && (
                <VerifiedBadge className="h-3 w-3 inline flex-shrink-0" />
              )}
            </div>
          )}

          {/* Product Title */}
          <Link
            href={`/product/${product._id}`}
            className="line-clamp-2 text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-relaxed"
            title={product.name}
          >
            {product.name}
          </Link>
        </div>

        <div>
          {/* Price block */}
          <div className="flex items-baseline gap-2">
            <span className="text-base font-black text-slate-900">
              ৳{Number(product.discountPrice ?? product.price).toFixed(0)}
            </span>
            {hasDiscount && (
              <span className="text-xs font-semibold text-slate-400 line-through">
                ৳{Number(product.price).toFixed(0)}
              </span>
            )}
          </div>

          {/* Ratings & Orders */}
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1">
              <span className="text-amber-400">★</span>
              <span className="font-bold text-slate-700">{Number(product.rating || 4.5).toFixed(1)}</span>
              <span>({product.numReviews || 0})</span>
            </div>
            {product.soldCount > 0 && (
              <span className="text-[10px] text-slate-400 font-medium">
                {product.soldCount} sold
              </span>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-3">
            <button
              type="button"
              onClick={handleQuickAdd}
              className={`w-full flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-extrabold transition-all duration-200 shadow-sm ${
                justAdded
                  ? 'bg-emerald-600 text-white shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-md hover:shadow-indigo-500/20 active:scale-[0.98]'
              }`}
            >
              {justAdded ? (
                <>
                  <span>✓</span>
                  <span>Added to Bag!</span>
                </>
              ) : (
                <>
                  <span>🛒</span>
                  <span>Quick Add</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
