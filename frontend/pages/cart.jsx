import Link from 'next/link';
import { useState } from 'react';
import MarketplaceLayout from '../components/MarketplaceLayout';
import { useStore } from '../components/StoreProvider';

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

  const deliveryCharge = subtotal > 1500 ? 0 : 80;
  const total = subtotal - couponDiscount + deliveryCharge;

  return (
    <MarketplaceLayout>
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 md:grid-cols-[1fr_320px] md:px-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
          <h1 className="mb-4 text-2xl font-black">Shopping Cart</h1>

          {!cart.length ? (
            <p className="text-sm text-slate-600">Your cart is empty. <Link href="/category" className="text-orange-500">Start shopping</Link>.</p>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <article key={item._id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3">
                  <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'} alt={item.name} className="h-16 w-16 rounded-lg object-cover" />
                  <div className="min-w-[200px] flex-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-orange-500">৳{Number(item.unitPrice).toFixed(0)}</p>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item._id, Number(e.target.value))}
                    className="input w-20"
                  />
                  <button type="button" onClick={() => removeFromCart(item._id)} className="text-sm font-semibold text-rose-500">Remove</button>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
          <h2 className="text-lg font-bold">Order Summary</h2>
          <div className="mt-3 space-y-2 text-sm">
            <p className="flex justify-between"><span>Subtotal</span><span>৳{subtotal.toFixed(2)}</span></p>
            <p className="flex justify-between"><span>Delivery</span><span>{deliveryCharge === 0 ? 'Free' : `৳${deliveryCharge}`}</span></p>
            <p className="flex justify-between text-green-600"><span>Coupon Discount</span><span>-৳{couponDiscount.toFixed(2)}</span></p>
            <p className="flex justify-between border-t pt-2 font-bold"><span>Total</span><span>৳{Math.max(0, total).toFixed(2)}</span></p>
          </div>

          <CouponBox applyCoupon={applyCoupon} coupon={coupon} clearCoupon={clearCoupon} />

          <Link href="/checkout" className="mt-4 block rounded-xl bg-orange-500 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-orange-600">Proceed to Checkout</Link>
        </aside>
      </main>
    </MarketplaceLayout>
  );
}

function CouponBox({ applyCoupon, coupon, clearCoupon }) {
  return (
    <div className="mt-4 rounded-xl border border-slate-200 p-3 text-sm">
      <p className="mb-2 font-semibold">Apply Coupon</p>
      {coupon ? (
        <div className="flex items-center justify-between">
          <p className="text-green-600">{coupon.code} applied</p>
          <button type="button" className="text-rose-500" onClick={clearCoupon}>Remove</button>
        </div>
      ) : (
        <CouponForm applyCoupon={applyCoupon} />
      )}
    </div>
  );
}

function CouponForm({ applyCoupon }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const res = applyCoupon(code);
        setMsg(res.message);
      }}
      className="space-y-2"
    >
      <input value={code} onChange={(e) => setCode(e.target.value)} className="input" placeholder="MEGA10 / EID150" />
      {msg && <p className="text-xs text-slate-500">{msg}</p>}
      <button type="submit" className="w-full rounded-lg bg-slate-900 px-3 py-2 text-white">Apply</button>
    </form>
  );
}
