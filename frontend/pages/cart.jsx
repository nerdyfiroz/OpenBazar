import Link from 'next/link';
import { useState } from 'react';
import MarketplaceLayout from '../components/MarketplaceLayout';
import { useStore } from '../components/StoreProvider';
import { resolveImageSrc, FALLBACK_IMAGE } from '../utils/resolveImageSrc';

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

  const totalMangoKg = cart.filter(item => item.category === 'Mango').reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const regularItemsCount = cart.filter(item => item.category !== 'Mango').reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalItems = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const baseDeliveryCharge = regularItemsCount > 0 ? (deliveryArea === 'dhaka' ? 70 : 120) : 0;
  const deliveryDiscountRate = regularItemsCount >= 4 ? 1 : regularItemsCount >= 3 ? 0.7 : 0;
  
  const mangoDeliveryCharge = totalMangoKg * 10;
  const regularDeliveryCharge = Number((baseDeliveryCharge * (1 - deliveryDiscountRate)).toFixed(2));
  const deliveryCharge = regularDeliveryCharge + mangoDeliveryCharge;

  const total = subtotal - couponDiscount + deliveryCharge;
  const mangoError = totalMangoKg > 0 && (totalMangoKg < 10 || totalMangoKg > 40) ? `Mango orders must be between 10 kg and 40 kg. Currently: ${totalMangoKg} kg.` : null;

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
                  <img src={resolveImageSrc(item.images?.[0] || item.photos?.[0])} alt={item.name} className="h-16 w-16 rounded-lg object-cover" onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }} />
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
          <div className="mt-3 rounded-lg border border-slate-200 p-3 text-sm">
            <p className="mb-2 font-semibold">Delivery Area</p>
            <select className="input" value={deliveryArea} onChange={(e) => setDeliveryArea(e.target.value)}>
              <option value="dhaka">Dhaka (৳70)</option>
              <option value="outside">Outside Dhaka (৳120)</option>
            </select>
            <p className="mt-2 text-xs text-slate-600">
              {regularItemsCount > 0 ? (
                regularItemsCount >= 4
                  ? '4+ regular items: 100% regular delivery discount applied.'
                  : regularItemsCount >= 3
                    ? '3 regular items: 70% regular delivery discount applied.'
                    : 'Buy at least 3 regular items to get a delivery discount.'
              ) : 'No regular items.'}
              {totalMangoKg > 0 && ` Mango delivery charge: ৳10/kg (${totalMangoKg} kg = ৳${mangoDeliveryCharge}).`}
            </p>
          </div>
          {mangoError && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {mangoError}
            </div>
          )}
          <div className="mt-3 space-y-2 text-sm">
            <p className="flex justify-between"><span>Subtotal</span><span>৳{subtotal.toFixed(2)}</span></p>
            {regularItemsCount > 0 && <p className="flex justify-between"><span>Regular Base Delivery</span><span>৳{baseDeliveryCharge.toFixed(2)}</span></p>}
            {regularItemsCount > 0 && deliveryDiscountRate > 0 && <p className="flex justify-between text-green-600"><span>Regular Delivery Discount</span><span>-৳{(baseDeliveryCharge - regularDeliveryCharge).toFixed(2)}</span></p>}
            {totalMangoKg > 0 && <p className="flex justify-between"><span>Mango Delivery (৳10/kg)</span><span>৳{mangoDeliveryCharge.toFixed(2)}</span></p>}
            <p className="flex justify-between"><span>Total Delivery</span><span>{deliveryCharge === 0 ? 'Free' : `৳${deliveryCharge.toFixed(2)}`}</span></p>
            {couponDiscount > 0 && <p className="flex justify-between text-green-600"><span>Coupon Discount</span><span>-৳{couponDiscount.toFixed(2)}</span></p>}
            <p className="flex justify-between border-t pt-2 font-bold"><span>Total</span><span>৳{Math.max(0, total).toFixed(2)}</span></p>
          </div>

          <CouponBox applyCoupon={applyCoupon} coupon={coupon} clearCoupon={clearCoupon} totalItems={totalItems} />

          <Link href={mangoError ? '#' : '/checkout'} className={`mt-4 block rounded-xl bg-orange-500 px-4 py-3 text-center text-sm font-semibold text-white ${mangoError ? 'pointer-events-none opacity-50' : 'hover:bg-orange-600'}`}>Proceed to Checkout</Link>
        </aside>
      </main>
    </MarketplaceLayout>
  );
}

function CouponBox({ applyCoupon, coupon, clearCoupon, totalItems }) {
  return (
    <div className="mt-4 rounded-xl border border-slate-200 p-3 text-sm">
      <p className="mb-2 font-semibold">Apply Coupon</p>
      {coupon ? (
        <div className="flex items-center justify-between">
          <p className="text-green-600">{coupon.code} applied</p>
          <button type="button" className="text-rose-500" onClick={clearCoupon}>Remove</button>
        </div>
      ) : (
        <CouponForm applyCoupon={applyCoupon} totalItems={totalItems} />
      )}
    </div>
  );
}

function CouponForm({ applyCoupon, totalItems }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const res = await applyCoupon(code, totalItems);
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
