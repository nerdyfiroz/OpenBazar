import Image from 'next/image';
import Link from 'next/link';
import { useStore } from './StoreProvider';
import { resolveImageSrc, FALLBACK_IMAGE } from '../utils/resolveImageSrc';

export default function ProductCard({ product }) {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const isWished = wishlist.some((item) => item._id === product._id);
  const hasDiscount = Number(product.discountPrice) > 0 && product.discountPrice < product.price;
  const imageSrc = resolveImageSrc(product.images?.[0] || product.photos?.[0]);

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative overflow-hidden rounded-xl bg-slate-100 h-44 w-full">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        {hasDiscount && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-orange-500 px-2 py-1 text-xs font-bold text-white">
            -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
          </span>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <Link href={`/product/${product._id}`} className="line-clamp-2 text-sm font-semibold hover:text-orange-500">
          {product.name}
        </Link>

        <div className="flex items-end gap-2">
          <p className="text-lg font-bold text-orange-500">৳{Number(product.discountPrice ?? product.price).toFixed(0)}</p>
          {hasDiscount && <p className="text-xs text-slate-500 line-through">৳{Number(product.price).toFixed(0)}</p>}
        </div>

        <p className="text-xs text-amber-500">★ {Number(product.rating || 4.2).toFixed(1)} · {product.numReviews || 0} reviews</p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => addToCart(product, 1)}
            className="flex-1 rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600"
          >
            Add to Cart
          </button>
          <button
            type="button"
            onClick={() => toggleWishlist(product)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold ${isWished ? 'border-rose-300 bg-rose-50 text-rose-600' : 'border-slate-200 hover:bg-slate-50'}`}
          >
            ♥
          </button>
        </div>
      </div>
    </article>
  );
}
