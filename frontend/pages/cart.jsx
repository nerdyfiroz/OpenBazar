import Link from 'next/link';
import { useState } from 'react';
import MarketplaceLayout from '../components/MarketplaceLayout';
import { useStore } from '../components/StoreProvider';
import { resolveImageSrc } from '../utils/resolveImageSrc';
import SmartImage from '../components/SmartImage';
import SEO from '../components/SEO';
import SmartCouponSection from '../components/SmartCouponSection';

export default function Cart() {
  const {
    cart,
    subtotal,
    coupon,
    couponDiscount,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    clearCoupon
  } = useStore();

  const [deliveryArea, setDeliveryArea] = useState('dhaka');

  const totalItems = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const baseDeliveryCharge = totalItems > 0 ? (deliveryArea === 'dhaka' ? 70 : 120) : 0;
  const deliveryDiscountRate = totalItems >= 4 ? 1 : totalItems >= 3 ? 0.7 : 0;
  const deliveryCharge = Number((baseDeliveryCharge * (1 - deliveryDiscountRate)).toFixed(2));

  const total = subtotal - couponDiscount + deliveryCharge;

  return (
    <MarketplaceLayout>
      <SEO title="Cart" description="View items in your shopping cart." canonical="/cart" noindex />
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 md:grid-cols-[1fr_320px] md:px-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
          <h1 className="mb-4 text-2xl font-black">Shopping Cart</h1>

          {!cart.length ? (
            <p className="text-sm text-slate-600">Your cart is empty. <Link href="/category" className="text-orange-500">Start shopping</Link>.</p>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <article key={item.cartKey || item._id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3">
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-slate-100">
                    <SmartImage
                      src={resolveImageSrc(item.images?.[0] || item.photos?.[0])}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-[200px] flex-1">
                    <p className="font-semibold">{item.name}</p>
                    {item.selectedWeight && <p className="text-xs font-bold text-orange-600">Weight: {item.selectedWeight}</p>}
                    <p className="text-sm text-orange-500">৳{Number(item.unitPrice).toFixed(0)}</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartKey || item._id, Math.max(1, Number(item.quantity) - 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-lg font-semibold text-slate-600 transition-colors hover:bg-slate-200"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          updateQuantity(item.cartKey || item._id, '');
                        } else {
                          const num = parseInt(val);
                          if (!isNaN(num) && num > 0) {
                            updateQuantity(item.cartKey || item._id, num);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        if (e.target.value === '' || Number(e.target.value) < 1) {
                          updateQuantity(item.cartKey || item._id, 1);
                        }
                      }}
                      className="h-8 w-12 text-center text-sm font-semibold outline-none bg-transparent [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartKey || item._id, Number(item.quantity || 1) + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-lg font-semibold text-slate-600 transition-colors hover:bg-slate-200"
                    >
                      +
                    </button>
                  </div>
                  <button type="button" onClick={() => removeFromCart(item.cartKey || item._id)} className="text-sm font-semibold text-rose-500">Remove</button>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
          <h2 className="text-lg font-bold">Order Summary</h2>
          <div className="mt-3 rounded-lg border border-slate-200 p-3 text-sm">
            <p className="mb-2 font-semibold">Delivery Area</p>
            <select className="input" value={deliveryArea} onChange={(e) => setDeliveryArea(e.target.value)}>
              <option value="dhaka">Dhaka (৳70)</option>
              <option value="outside">Outside Dhaka (৳120)</option>
            </select>
            <p className="mt-2 text-xs text-slate-600">
              {totalItems > 0 ? (
                totalItems >= 4
                  ? '4+ items: 100% delivery discount applied.'
                  : totalItems >= 3
                    ? '3 items: 70% delivery discount applied.'
                    : 'Buy at least 3 items to get a delivery discount.'
              ) : 'Cart is empty.'}
            </p>
          </div>

          <div className="mt-3 space-y-2 text-sm">
            <p className="flex justify-between"><span>Subtotal</span><span>৳{subtotal.toFixed(2)}</span></p>
            {totalItems > 0 && <p className="flex justify-between"><span>Base Delivery</span><span>৳{baseDeliveryCharge.toFixed(2)}</span></p>}
            {totalItems > 0 && deliveryDiscountRate > 0 && <p className="flex justify-between text-green-600"><span>Delivery Discount</span><span>-৳{(baseDeliveryCharge - deliveryCharge).toFixed(2)}</span></p>}
            <p className="flex justify-between"><span>Total Delivery</span><span>{deliveryCharge === 0 ? 'Free' : `৳${deliveryCharge.toFixed(2)}`}</span></p>
            {couponDiscount > 0 && <p className="flex justify-between text-green-600"><span>Coupon Discount</span><span>-৳{couponDiscount.toFixed(2)}</span></p>}
            <p className="flex justify-between border-t pt-2 font-bold"><span>Total</span><span>৳{Math.max(0, total).toFixed(2)}</span></p>
          </div>

          <SmartCouponSection
            subtotal={subtotal}
            totalItems={totalItems}
            appliedCoupon={coupon}
            couponDiscount={couponDiscount}
            onApplyCoupon={applyCoupon}
            onClearCoupon={clearCoupon}
          />

          <Link href="/checkout" className="mt-4 block rounded-xl bg-orange-500 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-orange-600">Proceed to Checkout</Link>
        </aside>
      </main>
    </MarketplaceLayout>
  );
}

