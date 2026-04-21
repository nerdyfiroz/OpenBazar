import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import MarketplaceLayout from '../components/MarketplaceLayout';
import { useStore } from '../components/StoreProvider';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

export default function Checkout() {
  const router = useRouter();
  const { cart, token, subtotal, couponDiscount, coupon } = useStore();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    paymentMethod: 'COD',
    transactionId: ''
  });

  const deliveryCharge = subtotal > 1500 ? 0 : 80;
  const total = useMemo(() => Math.max(0, subtotal - couponDiscount + deliveryCharge), [subtotal, couponDiscount, deliveryCharge]);

  const placeOrder = async (e) => {
    e.preventDefault();
    if (!token) {
      setMessage('Please login first to place order.');
      router.push('/login');
      return;
    }
    if (!cart.length) {
      setMessage('Cart is empty.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      if (coupon?.code) {
        const couponRes = await fetch(`${API_BASE}/coupons/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: coupon.code, subtotal })
        });
        const couponData = await couponRes.json();
        if (!couponRes.ok) {
          throw new Error(couponData.message || 'Coupon validation failed');
        }
      }

      const payload = {
        products: cart.map((item) => ({ product: item._id, quantity: item.quantity })),
        paymentMethod: 'COD',
        paymentInfo: {
          transactionId: form.transactionId || undefined,
          customerName: form.name,
          phone: form.phone,
          address: form.address,
          couponCode: coupon?.code || undefined,
          payable: total
        }
      };

      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Order failed');

      setMessage('Order placed successfully! Redirecting to your orders...');
      setTimeout(() => router.push('/user/orders'), 1200);
    } catch (error) {
      setMessage(error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MarketplaceLayout>
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 md:grid-cols-[1fr_320px] md:px-6">
        <form onSubmit={placeOrder} className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
          <h1 className="mb-4 text-2xl font-black">Checkout</h1>

          {message && <p className="mb-4 rounded-lg bg-slate-100 px-3 py-2 text-sm">{message}</p>}

          <div className="grid gap-3 md:grid-cols-2">
            <input className="input" placeholder="Full Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            <input className="input" placeholder="Phone Number" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} required />
          </div>
          <textarea className="input mt-3 min-h-24" placeholder="Delivery Address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} required />

          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold">Payment Method</p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="font-semibold">Cash on Delivery (COD)</p>
              <p className="mt-1 text-slate-600">Only COD is accepted at checkout.</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            <p className="font-semibold text-amber-800">Send Money (Optional)</p>
            <p className="mt-1 text-amber-700">bKash / Nagad / Rocket are available only for manual send money.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-700">
              <li>bKash: 01XXXXXXXXX</li>
              <li>Nagad: 01XXXXXXXXX</li>
              <li>Rocket: 01XXXXXXXXX</li>
            </ul>
            <input
              className="input mt-3 bg-white"
              placeholder="If sent money, enter Transaction ID (optional)"
              value={form.transactionId}
              onChange={(e) => setForm((p) => ({ ...p, transactionId: e.target.value }))}
            />
          </div>

          <button type="submit" disabled={loading} className="mt-5 rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-70">
            {loading ? 'Placing Order...' : 'Confirm Order'}
          </button>
        </form>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
          <h2 className="text-lg font-bold">Payable Summary</h2>
          <div className="mt-3 space-y-2 text-sm">
            <p className="flex justify-between"><span>Subtotal</span><span>৳{subtotal.toFixed(2)}</span></p>
            <p className="flex justify-between"><span>Delivery</span><span>{deliveryCharge === 0 ? 'Free' : `৳${deliveryCharge}`}</span></p>
            <p className="flex justify-between text-green-600"><span>Coupon</span><span>-৳{couponDiscount.toFixed(2)}</span></p>
            <p className="flex justify-between border-t pt-2 font-bold"><span>Total</span><span>৳{total.toFixed(2)}</span></p>
          </div>
        </aside>
      </main>
    </MarketplaceLayout>
  );
}
