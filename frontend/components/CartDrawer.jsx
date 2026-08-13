import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useStore } from './StoreProvider';
import { resolveImageSrc } from '../utils/resolveImageSrc';
import SmartImage from './SmartImage';

export default function CartDrawer() {
  const router = useRouter();
  const {
    cart,
    subtotal,
    cartDrawerOpen,
    closeCartDrawer,
    updateQuantity,
    removeFromCart,
    couponDiscount,
  } = useStore();

  const totalItems = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const freeShippingThreshold = 4; // 4 items for free delivery
  const itemsRemainingForFreeDelivery = Math.max(0, freeShippingThreshold - totalItems);
  const progressPercent = Math.min(100, (totalItems / freeShippingThreshold) * 100);

  // Close drawer on route change
  useEffect(() => {
    closeCartDrawer();
  }, [router.asPath]);

  // Lock body scroll when open
  useEffect(() => {
    if (cartDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [cartDrawerOpen]);

  if (!cartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div
        onClick={closeCartDrawer}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
      />

      {/* Slide-over panel */}
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 animate-slide-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛍️</span>
            <h2 className="text-lg font-extrabold text-slate-900">
              Shopping Bag
              {totalItems > 0 && (
                <span className="ml-2 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-600">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeCartDrawer}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Free Delivery Meter */}
        <div className="bg-gradient-to-r from-indigo-50/80 via-blue-50/60 to-purple-50/80 px-6 py-3.5 border-b border-indigo-100/60">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-indigo-900 flex items-center gap-1.5">
              <span>🚚</span>
              {itemsRemainingForFreeDelivery === 0
                ? '🎉 Congratulations! You unlocked FREE Delivery!'
                : `Add ${itemsRemainingForFreeDelivery} more ${itemsRemainingForFreeDelivery === 1 ? 'item' : 'items'} for FREE Delivery`}
            </span>
            <span className="font-bold text-indigo-600">{Math.round(progressPercent)}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-indigo-200/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-4xl mb-4 shadow-inner">
                🛒
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">Your bag is currently empty</h3>
              <p className="text-xs text-slate-500 max-w-[220px] mb-6 leading-relaxed">
                Discover trending gadgets, fashion, and lifestyle deals on OpenBazar.
              </p>
              <button
                type="button"
                onClick={() => {
                  closeCartDrawer();
                  router.push('/category');
                }}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition"
              >
                Start Exploring Deals →
              </button>
            </div>
          ) : (
            cart.map((item) => {
              const key = item.cartKey || item._id;
              const img = resolveImageSrc(item.images?.[0] || item.photos?.[0] || item.image || item.photoUrl);
              const price = item.unitPrice ?? item.price ?? 0;

              return (
                <div key={key} className="flex gap-3.5 py-4 group">
                  {/* Thumbnail */}
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200/80">
                    <SmartImage
                      src={img}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/product/${item._id}`}
                          onClick={closeCartDrawer}
                          className="font-bold text-xs text-slate-800 hover:text-indigo-600 line-clamp-2 leading-snug"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFromCart(key)}
                          className="text-slate-300 hover:text-rose-500 text-xs transition p-0.5"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Variant tags */}
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.selectedWeight && (
                          <span className="inline-block rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                            {item.selectedWeight}
                          </span>
                        )}
                        {item.selectedColor && (
                          <span className="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                            {item.selectedColor}
                          </span>
                        )}
                        {item.selectedSize && (
                          <span className="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                            Size: {item.selectedSize}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity & Price */}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 shadow-sm">
                        <button
                          type="button"
                          onClick={() => updateQuantity(key, Math.max(1, Number(item.quantity || 1) - 1))}
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 transition shadow-sm"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-xs font-extrabold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(key, Number(item.quantity || 1) + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 transition shadow-sm"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-black text-slate-900">
                          ৳{(price * item.quantity).toFixed(0)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-[10px] text-slate-400">৳{price.toFixed(0)} each</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Checkout Summary */}
        {cart.length > 0 && (
          <div className="border-t border-slate-200/80 bg-slate-50/60 p-6 space-y-3">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">৳{subtotal.toFixed(2)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span>−৳{couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Estimated Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between border-t border-slate-200/80 pt-2 text-sm font-extrabold text-slate-900">
                <span>Estimated Total</span>
                <span className="text-base font-black text-indigo-600">
                  ৳{Math.max(0, subtotal - couponDiscount).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  closeCartDrawer();
                  router.push('/checkout');
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99] transition duration-200"
              >
                <span>Proceed to Checkout</span>
                <span className="text-lg">→</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  closeCartDrawer();
                  router.push('/cart');
                }}
                className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100/80 transition"
              >
                View Full Cart & Apply Coupons
              </button>
            </div>

            <p className="text-center text-[10.5px] text-slate-400 pt-1">
              🔒 100% Secure Checkout · Cash on Delivery available
            </p>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-left {
          animation: slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
