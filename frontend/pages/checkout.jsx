import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import MarketplaceLayout from '../components/MarketplaceLayout';
import { useStore } from '../components/StoreProvider';
import { BANGLADESH_AREAS, BANGLADESH_DIVISIONS, getDistrictOptions, getUpazilaOptions, getUnionOptions } from '../utils/bdAddressOptions';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

export default function Checkout() {
  const router = useRouter();
  const { cart, token, user, subtotal, couponDiscount, coupon } = useStore();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
    division: '',
    district: '',
    upazila: '',
    union: '',
    ward: '',
    area: '',
    locationType: '',
    phone: '',
    paymentMethod: 'COD',
    mobileBankingProvider: 'bKash',
    transactionId: ''
  });

  const districtOptions = useMemo(() => getDistrictOptions(form.division), [form.division]);
  const upazilaOptions = useMemo(() => getUpazilaOptions(form.district), [form.district]);
  const unionOptions = useMemo(() => getUnionOptions(form.upazila), [form.upazila]);
  const totalItems = useMemo(() => cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0), [cart]);

  const effectiveUser = user || null;

  useEffect(() => {
    if (!effectiveUser) return;
    setForm((prev) => ({
      ...prev,
      name: prev.name || effectiveUser.name || '',
      email: prev.email || effectiveUser.email || '',
      phone: prev.phone || effectiveUser.phone || ''
    }));
  }, [effectiveUser]);

  // Redirect to cart if it's empty
  useEffect(() => {
    if (!cart.length) router.push('/cart');
  }, [cart.length]);

  const baseDeliveryCharge = useMemo(() => (
    String(form.division || '').trim().toLowerCase() === 'dhaka' ? 70 : 120
  ), [form.division]);
  const deliveryDiscountRate = totalItems >= 4 ? 1 : totalItems >= 3 ? 0.7 : 0;
  const deliveryCharge = useMemo(() => Number((baseDeliveryCharge * (1 - deliveryDiscountRate)).toFixed(2)), [baseDeliveryCharge, deliveryDiscountRate]);
  const total = useMemo(() => Math.max(0, subtotal - couponDiscount + deliveryCharge), [subtotal, couponDiscount, deliveryCharge]);

  const placeOrder = async (e) => {
    e.preventDefault();
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
          body: JSON.stringify({ code: coupon.code, subtotal, totalItems })
        });
        const couponData = await couponRes.json();
        if (!couponRes.ok) {
          throw new Error(couponData.message || 'Coupon validation failed');
        }
      }

      const payload = {
        products: cart.map((item) => ({ product: item._id, quantity: item.quantity })),
        paymentMethod: form.paymentMethod === 'COD' ? 'COD' : form.mobileBankingProvider,
        paymentInfo: {
          transactionId: form.transactionId || undefined,
          customerName: form.name,
          email: form.email,
          phone: form.phone,
          division: form.division,
          district: form.district,
          upazila: form.upazila,
          union: form.union,
          ward: form.ward,
          area: form.area,
          fullAddress: [form.locationType, form.union, form.ward, form.area, form.address].filter(Boolean).join(', '),
          couponCode: coupon?.code || undefined,
          payable: total
        }
      };

      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Order failed');

      setMessage('Order placed successfully!');
      const orderId = data.order?._id || data._id || '';
      // Clear cart after successful order
      setTimeout(() => router.push(`/order-success${orderId ? `?orderId=${orderId}` : ''}`), 400);
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

          {!token && (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Guest checkout is enabled. You can place an order without creating an account.
            </p>
          )}

          {message && <p className="mb-4 rounded-lg bg-slate-100 px-3 py-2 text-sm">{message}</p>}

          <div className="grid gap-3 md:grid-cols-2">
            <input className="input" placeholder="Full Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            <input className="input" type="email" placeholder="Email Address" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
            <input className="input" placeholder="Phone Number" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} required />

            <select
              className="input"
              value={form.division}
              onChange={(e) => setForm((p) => ({ ...p, division: e.target.value, district: '', upazila: '' }))}
              required
            >
              <option value="">Select Division</option>
              {BANGLADESH_DIVISIONS.map((division) => <option key={division} value={division}>{division}</option>)}
            </select>

            <select
              className="input"
              value={form.district}
              onChange={(e) => setForm((p) => ({ ...p, district: e.target.value, upazila: '' }))}
              disabled={!districtOptions.length}
              required
            >
              <option value="">Select District</option>
              {districtOptions.map((district) => <option key={district} value={district}>{district}</option>)}
            </select>

            <select
              className="input"
              value={form.upazila}
              onChange={(e) => setForm((p) => ({ ...p, upazila: e.target.value, union: '' }))}
              disabled={!upazilaOptions.length}
              required
            >
              <option value="">Select Upazila</option>
              {upazilaOptions.map((upazila) => <option key={upazila} value={upazila}>{upazila}</option>)}
            </select>

            {!upazilaOptions.length && (
              <input
                className="input"
                placeholder="Type your upazila manually"
                value={form.upazila}
                onChange={(e) => setForm((p) => ({ ...p, upazila: e.target.value, union: '' }))}
                required
              />
            )}

            {/* Union / Paurashava dropdown — appears when unions exist for the selected upazila */}
            {unionOptions.length > 0 ? (
              <select
                className="input"
                value={form.union}
                onChange={(e) => setForm((p) => ({ ...p, union: e.target.value }))}
              >
                <option value="">Select Union / Paurashava (optional)</option>
                {unionOptions.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            ) : (
              <input
                className="input"
                placeholder="Union / Paurashava (optional)"
                value={form.union}
                onChange={(e) => setForm((p) => ({ ...p, union: e.target.value }))}
              />
            )}

            <select
              className="input"
              value={form.locationType}
              onChange={(e) => setForm((p) => ({ ...p, locationType: e.target.value }))}
            >
              <option value="">Select Area Type</option>
              {BANGLADESH_AREAS.map((areaType) => <option key={areaType} value={areaType}>{areaType}</option>)}
            </select>

            <input
              className="input md:col-span-2"
              placeholder="Area / Village / Road / House No."
              value={form.area}
              onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))}
              required
            />

            <input
              className="input md:col-span-2"
              placeholder="Ward"
              value={form.ward}
              onChange={(e) => setForm((p) => ({ ...p, ward: e.target.value }))}
              required
            />

            <textarea className="input md:col-span-2 min-h-24" placeholder="Full delivery address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} required />
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold">Payment Method</p>
            <select className="input" value={form.paymentMethod} onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))}>
              <option value="COD">Cash on Delivery (COD)</option>
              <option value="bKash">Send Money by bKash</option>
              <option value="Nagad">Send Money by Nagad</option>
              <option value="Rocket">Send Money by Rocket</option>
            </select>
          </div>

          {form.paymentMethod !== 'COD' && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
              <p className="font-semibold text-amber-800">Send Money by Mobile Banking</p>
              <p className="mt-1 text-amber-700">Choose your provider and enter your transaction ID for manual verification.</p>
              <select className="input mt-3 bg-white" value={form.mobileBankingProvider} onChange={(e) => setForm((p) => ({ ...p, mobileBankingProvider: e.target.value }))}>
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="Rocket">Rocket</option>
              </select>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-700">
                <li>bKash: 01XXXXXXXXX</li>
                <li>Nagad: 01XXXXXXXXX</li>
                <li>Rocket: 01XXXXXXXXX</li>
              </ul>
            </div>
          )}

          {form.paymentMethod !== 'COD' && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
              <p className="font-semibold text-amber-800">Transaction ID <span className="text-red-500">*</span></p>
              <p className="mt-1 text-amber-700">Required — enter your send-money Transaction ID for verification.</p>
              <input
                className="input mt-3 bg-white"
                placeholder="Enter Transaction ID"
                value={form.transactionId}
                onChange={(e) => setForm((p) => ({ ...p, transactionId: e.target.value }))}
                required
              />
            </div>
          )}

          <button type="submit" disabled={loading} className="mt-5 rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-70">
            {loading ? 'Placing Order...' : 'Confirm Order'}
          </button>
        </form>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
          <h2 className="text-lg font-bold">Payable Summary</h2>
          <p className="mt-2 text-xs text-slate-600">
            {totalItems >= 4
              ? '4+ items: 100% delivery discount applied.'
              : totalItems >= 3
                ? '3 items: 70% delivery discount applied.'
                : 'Buy at least 3 items to get delivery discount.'}
          </p>
          <div className="mt-3 space-y-2 text-sm">
            <p className="flex justify-between"><span>Subtotal</span><span>৳{subtotal.toFixed(2)}</span></p>
            <p className="flex justify-between"><span>Base Delivery</span><span>৳{baseDeliveryCharge.toFixed(2)}</span></p>
            <p className="flex justify-between text-green-600"><span>Delivery Discount</span><span>-৳{(baseDeliveryCharge - deliveryCharge).toFixed(2)}</span></p>
            <p className="flex justify-between"><span>Delivery</span><span>{deliveryCharge === 0 ? 'Free' : `৳${deliveryCharge.toFixed(2)}`}</span></p>
            <p className="flex justify-between text-green-600"><span>Coupon</span><span>-৳{couponDiscount.toFixed(2)}</span></p>
            <p className="flex justify-between border-t pt-2 font-bold"><span>Total</span><span>৳{total.toFixed(2)}</span></p>
          </div>
        </aside>
      </main>
    </MarketplaceLayout>
  );
}
