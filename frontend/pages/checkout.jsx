import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import MarketplaceLayout from '../components/MarketplaceLayout';
import { useStore } from '../components/StoreProvider';
import {
  BANGLADESH_AREAS,
  BANGLADESH_DIVISIONS,
  getDistrictOptions,
  getUpazilaOptions,
  getUnionOptions,
} from '../utils/bdAddressOptions';
import SEO from '../components/SEO';
import OrderCompleteButton from '../components/OrderCompleteButton';
import MobileVerificationModal from '../components/MobileVerificationModal';
import { getApiBase } from '../utils/apiBase';

const API_BASE = getApiBase();

/* ─── Premium form input ───────────────────────────────────────────────────── */
function CInput({ type = 'text', placeholder, value, onChange, required, id, as: Tag = 'input', children, rows }) {
  const [focused, setFocused] = useState(false);
  const base = {
    display: 'block', width: '100%', boxSizing: 'border-box',
    padding: Tag === 'textarea' ? '12px 14px' : '0 14px',
    height: Tag === 'textarea' ? 'auto' : 48,
    border: `1.5px solid ${focused ? '#6366f1' : 'rgba(148,163,184,0.35)'}`,
    borderRadius: 12,
    background: focused ? '#fff' : '#f8faff',
    fontSize: 14, color: '#1e1b4b', outline: 'none',
    boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.13)' : 'none',
    transition: 'all 200ms ease',
    fontFamily: 'inherit',
    resize: Tag === 'textarea' ? 'vertical' : undefined,
    minHeight: Tag === 'textarea' ? 80 : undefined,
  };
  if (Tag === 'textarea') {
    return (
      <textarea
        id={id} placeholder={placeholder} value={value} onChange={onChange}
        required={required} rows={rows || 3}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={base}
      />
    );
  }
  if (Tag === 'select') {
    return (
      <select
        id={id} value={value} onChange={onChange} required={required}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          ...base,
          appearance: 'none',
          cursor: 'pointer',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236366f1' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px',
          paddingRight: 40,
        }}
      >
        {children}
      </select>
    );
  }
  return (
    <input
      id={id} type={type} placeholder={placeholder} value={value}
      onChange={onChange} required={required}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={base}
    />
  );
}

/* ─── Field label ──────────────────────────────────────────────────────────── */
function FLabel({ htmlFor, children, required }) {
  return (
    <label htmlFor={htmlFor} style={{
      display: 'block', fontSize: 11.5, fontWeight: 700,
      color: '#6366f1', marginBottom: 6, letterSpacing: '0.4px', textTransform: 'uppercase',
    }}>
      {children}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
    </label>
  );
}

/* ─── Section card wrapper ─────────────────────────────────────────────────── */
function SectionCard({ icon, title, children, accent = '#6366f1' }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: '28px 28px 24px',
      boxShadow: '0 2px 16px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04)',
      border: '1.5px solid rgba(99,102,241,0.10)',
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 16,
          background: `linear-gradient(135deg, ${accent}18, ${accent}30)`,
        }}>
          {icon}
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1e1b4b', margin: 0, letterSpacing: '-0.2px' }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

/* ─── Payment method radio card ────────────────────────────────────────────── */
function PaymentCard({ value, selected, onChange, icon, label, sublabel }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
      borderRadius: 14, cursor: 'pointer',
      border: `2px solid ${selected ? '#6366f1' : 'rgba(148,163,184,0.25)'}`,
      background: selected ? 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(99,102,241,0.02))' : '#f8faff',
      transition: 'all 200ms ease',
      boxShadow: selected ? '0 0 0 3px rgba(99,102,241,0.10)' : 'none',
    }}>
      <input
        type="radio" name="paymentMethod" value={value}
        checked={selected} onChange={() => onChange(value)}
        style={{ display: 'none' }}
      />
      <div style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${selected ? '#6366f1' : '#cbd5e1'}`,
        background: selected ? '#6366f1' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 200ms ease',
      }}>
        {selected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
      </div>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e1b4b' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{sublabel}</div>}
      </div>
    </label>
  );
}

/* ─── Auth-required overlay ────────────────────────────────────────────────── */
function AuthRequiredModal() {
  const router = useRouter();
  const [hov1, setHov1] = useState(false);
  const [hov2, setHov2] = useState(false);
  return (
    <div style={{
      minHeight: '72vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px',
      background: 'radial-gradient(ellipse at 20% 40%, rgba(99,102,241,0.12) 0%, transparent 55%),' +
        'radial-gradient(ellipse at 80% 60%, rgba(59,130,246,0.10) 0%, transparent 55%), #eef0f8',
    }}>
      <div style={{
        background: '#fff', borderRadius: 28, padding: '52px 48px', maxWidth: 480, width: '100%',
        boxShadow: '0 24px 64px rgba(99,102,241,0.16), 0 8px 24px rgba(0,0,0,0.07)',
        textAlign: 'center',
      }}>
        {/* Icon */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
          background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
          boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
        }}>
          🔐
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 850, color: '#1e1b4b', marginBottom: 12, letterSpacing: '-0.3px' }}>
          Sign In to Place Your Order
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 36, maxWidth: 320, margin: '0 auto 32px' }}>
          Creating an account lets you track your orders, save addresses, and get exclusive deals on OpenBazar.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => router.push('/login?redirect=/checkout')}
            onMouseEnter={() => setHov1(true)} onMouseLeave={() => setHov1(false)}
            style={{
              width: '100%', height: 50, borderRadius: 14, border: 'none',
              background: hov1 ? 'linear-gradient(135deg,#2563eb,#4f46e5)' : 'linear-gradient(135deg,#3b82f6,#6366f1)',
              color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
              transform: hov1 ? 'translateY(-1px)' : 'none',
              transition: 'all 200ms ease',
            }}
          >
            Sign In to My Account
          </button>

          <button
            onClick={() => router.push('/login?redirect=/checkout')}
            onMouseEnter={() => setHov2(true)} onMouseLeave={() => setHov2(false)}
            style={{
              width: '100%', height: 50, borderRadius: 14,
              border: '2px solid rgba(99,102,241,0.3)',
              background: hov2 ? 'rgba(99,102,241,0.06)' : 'transparent',
              color: '#6366f1', fontSize: 15, fontWeight: 800, cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
          >
            Create a Free Account
          </button>
        </div>

        <p style={{ marginTop: 20, fontSize: 12, color: '#94a3b8' }}>
          Already have an account?{' '}
          <button
            onClick={() => router.push('/login?redirect=/checkout')}
            style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Sign in here →
          </button>
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function Checkout() {
  const router = useRouter();
  const { cart, token, user, subtotal, couponDiscount, coupon } = useStore();
  const [message, setMessage] = useState('');
  const [msgIsError, setMsgIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderStatus, setOrderStatus] = useState('idle');
  const [step, setStep] = useState(1); // 1 = Address, 2 = Payment
  const [showPhoneVerificationModal, setShowPhoneVerificationModal] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', address: '',
    division: '', district: '', upazila: '', union: '', ward: '', area: '',
    locationType: '', phone: '',
    paymentMethod: 'COD',
    mobileBankingProvider: 'bKash',
    transactionId: '',
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
      phone: prev.phone || effectiveUser.phone || '',
    }));
  }, [effectiveUser]);

  // Redirect to cart if empty
  useEffect(() => {
    if (!cart.length) router.push('/cart');
  }, [cart.length]);

  const baseDeliveryCharge = useMemo(() => (
    totalItems > 0 ? (String(form.division || '').trim().toLowerCase() === 'dhaka' ? 70 : 120) : 0
  ), [form.division, totalItems]);

  const deliveryDiscountRate = totalItems >= 4 ? 1 : totalItems >= 3 ? 0.7 : 0;
  const deliveryCharge = useMemo(
    () => Number((baseDeliveryCharge * (1 - deliveryDiscountRate)).toFixed(2)),
    [baseDeliveryCharge, deliveryDiscountRate]
  );
  const total = useMemo(() => Math.max(0, subtotal - couponDiscount + deliveryCharge), [subtotal, couponDiscount, deliveryCharge]);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const placeOrder = async (e) => {
    e.preventDefault();
    if (orderStatus !== 'idle') return;
    if (!cart.length) { setMessage('Cart is empty.'); return; }

    const cleanPhone = String(form.phone || '').replace(/\s+/g, '').trim();
    if (!cleanPhone) {
      setMessage('Mobile phone number is required to place your order.');
      setMsgIsError(true);
      return;
    }
    const isValidPhone = /^01[3-9]\d{8}$/.test(cleanPhone) || /^(\+?8801|8801|01)[3-9]\d{8}$/.test(cleanPhone);
    if (!isValidPhone) {
      setMessage('Please enter a valid 11-digit Bangladesh mobile phone number (e.g. 01712345678).');
      setMsgIsError(true);
      return;
    }

    setLoading(true);
    setOrderStatus('processing');
    setMessage('');
    setMsgIsError(false);

    try {
      if (coupon?.code) {
        const couponRes = await fetch(`${API_BASE}/coupons/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: coupon.code, subtotal, totalItems }),
        });
        const couponData = await couponRes.json();
        if (!couponRes.ok) throw new Error(couponData.message || 'Coupon validation failed');
      }

      const payload = {
        products: cart.map((item) => ({
          product: item._id, quantity: item.quantity,
          selectedWeight: item.selectedWeight || undefined,
          unitPrice: item.unitPrice || undefined,
        })),
        paymentMethod: form.paymentMethod === 'COD' ? 'COD' : form.mobileBankingProvider,
        paymentInfo: {
          transactionId: form.transactionId || undefined,
          customerName: form.name, email: form.email, phone: form.phone,
          division: form.division, district: form.district,
          upazila: form.upazila, union: form.union, ward: form.ward, area: form.area,
          fullAddress: [form.locationType, form.union, form.ward, form.area, form.address].filter(Boolean).join(', '),
          couponCode: coupon?.code || undefined,
          payable: total,
        },
      };

      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Order failed');

      const orderId = data.order?._id || data._id || '';
      setOrderStatus('success');
      setMsgIsError(false);
      setMessage('Order placed successfully! 🎉');
      setTimeout(() => {
        router.push(`/order-success${orderId ? `?orderId=${orderId}` : ''}`);
      }, 2000);
    } catch (error) {
      setOrderStatus('error');
      setMsgIsError(true);
      setMessage(error.message || 'Failed to place order. Please try again.');
      setTimeout(() => { setOrderStatus('idle'); setLoading(false); }, 1200);
      return;
    }
  };

  /* ── If not authenticated → show login wall ─────────────────────────────── */
  if (!token) {
    return (
      <MarketplaceLayout>
        <SEO title="Checkout" description="Sign in to place your order on OpenBazar." canonical="/checkout" noindex />
        <AuthRequiredModal />
      </MarketplaceLayout>
    );
  }

  /* ── Authenticated checkout ─────────────────────────────────────────────── */
  return (
    <MarketplaceLayout>
      <SEO title="Checkout" description="Secure checkout on OpenBazar." canonical="/checkout" noindex />

      {/* Page background */}
      <div style={{
        minHeight: '100vh', paddingBottom: 60,
        background: 'radial-gradient(ellipse at 0% 0%, rgba(99,102,241,0.07) 0%, transparent 40%),' +
          'radial-gradient(ellipse at 100% 100%, rgba(59,130,246,0.06) 0%, transparent 40%), #f0f2f8',
      }}>

        {/* Header strip */}
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 60%, #7c3aed 100%)',
          padding: '18px 24px', marginBottom: 0,
        }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>🛒</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 850, color: '#fff', letterSpacing: '-0.2px' }}>Secure Checkout</h1>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                Logged in as <strong>{user?.name}</strong> · {totalItems} item{totalItems !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Step indicator */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              {[1, 2].map((s) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    onClick={() => s < step && setStep(s)}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800,
                      background: step >= s ? '#fff' : 'rgba(255,255,255,0.2)',
                      color: step >= s ? '#6366f1' : 'rgba(255,255,255,0.6)',
                      cursor: s < step ? 'pointer' : 'default',
                      transition: 'all 200ms',
                    }}
                  >
                    {step > s ? '✓' : s}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: step >= s ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                    {s === 1 ? 'Address' : 'Payment'}
                  </span>
                  {s < 2 && <div style={{ width: 20, height: 2, background: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 16px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}
          className="checkout-grid"
        >
          {/* ── MAIN FORM ── */}
          <form onSubmit={placeOrder}>

            {/* ── STEP 1: Delivery Address ── */}
            <div style={{ display: step === 1 ? 'block' : 'none' }}>
              <SectionCard icon="👤" title="Contact Information">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <FLabel htmlFor="co-name" required>Full Name</FLabel>
                    <CInput id="co-name" placeholder="Your full name" value={form.name} onChange={set('name')} required />
                  </div>
                  <div>
                    <FLabel htmlFor="co-phone" required>Phone Number</FLabel>
                    <CInput id="co-phone" placeholder="01XXXXXXXXX" value={form.phone} onChange={set('phone')} required />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <FLabel htmlFor="co-email" required>Email Address</FLabel>
                    <CInput id="co-email" type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} required />
                  </div>
                </div>
              </SectionCard>

              <SectionCard icon="📍" title="Delivery Address in Bangladesh" accent="#10b981">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                  {/* Division */}
                  <div>
                    <FLabel htmlFor="co-division" required>Division</FLabel>
                    <CInput as="select" id="co-division" value={form.division}
                      onChange={(e) => setForm((p) => ({ ...p, division: e.target.value, district: '', upazila: '', union: '' }))}
                      required>
                      <option value="">Select Division</option>
                      {BANGLADESH_DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </CInput>
                  </div>

                  {/* District */}
                  <div>
                    <FLabel htmlFor="co-district" required>District</FLabel>
                    <CInput as="select" id="co-district" value={form.district}
                      onChange={(e) => setForm((p) => ({ ...p, district: e.target.value, upazila: '', union: '' }))}
                      required>
                      <option value="">{form.division ? 'Select District' : '— Select Division first —'}</option>
                      {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                    </CInput>
                  </div>

                  {/* Upazila */}
                  <div>
                    <FLabel htmlFor="co-upazila" required>Upazila / Thana</FLabel>
                    {upazilaOptions.length > 0 ? (
                      <CInput as="select" id="co-upazila" value={form.upazila}
                        onChange={(e) => setForm((p) => ({ ...p, upazila: e.target.value, union: '' }))}
                        required>
                        <option value="">{form.district ? 'Select Upazila' : '— Select District first —'}</option>
                        {upazilaOptions.map((u) => <option key={u} value={u}>{u}</option>)}
                      </CInput>
                    ) : (
                      <CInput id="co-upazila" placeholder="Type your upazila / thana" value={form.upazila}
                        onChange={(e) => setForm((p) => ({ ...p, upazila: e.target.value, union: '' }))} required />
                    )}
                  </div>

                  {/* Union / Paurashava */}
                  <div>
                    <FLabel htmlFor="co-union">Union / Paurashava</FLabel>
                    {unionOptions.length > 0 ? (
                      <CInput as="select" id="co-union" value={form.union}
                        onChange={(e) => setForm((p) => ({ ...p, union: e.target.value }))}>
                        <option value="">Select Union (optional)</option>
                        {unionOptions.map((u) => <option key={u} value={u}>{u}</option>)}
                      </CInput>
                    ) : (
                      <CInput id="co-union" placeholder="Union / Paurashava (optional)"
                        value={form.union} onChange={set('union')} />
                    )}
                  </div>

                  {/* Area Type */}
                  <div>
                    <FLabel htmlFor="co-area-type">Area Type</FLabel>
                    <CInput as="select" id="co-area-type" value={form.locationType}
                      onChange={set('locationType')}>
                      <option value="">Select Area Type</option>
                      {BANGLADESH_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </CInput>
                  </div>

                  {/* Ward */}
                  <div>
                    <FLabel htmlFor="co-ward">Ward No.</FLabel>
                    <CInput id="co-ward" placeholder="Ward number (if applicable)" value={form.ward} onChange={set('ward')} />
                  </div>

                  {/* Area / Village / Road */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <FLabel htmlFor="co-area" required>Village / Road / Area</FLabel>
                    <CInput id="co-area" placeholder="Village name, Road no., Area" value={form.area} onChange={set('area')} required />
                  </div>

                  {/* Full Address */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <FLabel htmlFor="co-address" required>Full Delivery Address</FLabel>
                    <CInput as="textarea" id="co-address" rows={3}
                      placeholder="House no., Floor, Building name, Landmark…"
                      value={form.address} onChange={set('address')} required />
                  </div>
                </div>

                {/* Delivery charge info banner */}
                {form.division && (
                  <div style={{
                    marginTop: 18, padding: '12px 16px', borderRadius: 12,
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.04))',
                    border: '1px solid rgba(16,185,129,0.2)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{ fontSize: 20 }}>{String(form.division).toLowerCase() === 'dhaka' ? '🏙️' : '🚚'}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#059669' }}>
                        {String(form.division).toLowerCase() === 'dhaka' ? 'Dhaka delivery: ৳70' : `${form.division} delivery: ৳120`}
                      </p>
                      <p style={{ margin: 0, fontSize: 11.5, color: '#34d399' }}>
                        {totalItems >= 4 ? '🎉 4+ items — FREE delivery!' : totalItems >= 3 ? '✨ 3 items — 70% delivery discount!' : 'Buy 3+ items to unlock delivery discounts'}
                      </p>
                    </div>
                  </div>
                )}
              </SectionCard>

              <button
                type="button"
                onClick={() => {
                  if (!form.name || !form.phone || !form.email || !form.division || !form.district || !form.upazila || !form.area || !form.address) {
                    setMessage('Please fill in all required address fields.');
                    setMsgIsError(true);
                    return;
                  }
                  const cleanPhone = String(form.phone || '').replace(/\s+/g, '').trim();
                  const isValidPhone = /^01[3-9]\d{8}$/.test(cleanPhone) || /^(\+?8801|8801|01)[3-9]\d{8}$/.test(cleanPhone);
                  if (!isValidPhone) {
                    setMessage('Please enter a valid 11-digit Bangladesh mobile phone number (e.g. 01712345678).');
                    setMsgIsError(true);
                    return;
                  }
                  setMessage('');
                  setStep(2);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  width: '100%', height: 52, borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
                  color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 4px 18px rgba(99,102,241,0.35)',
                  transition: 'all 200ms', letterSpacing: '0.3px',
                }}
              >
                Continue to Payment →
              </button>
            </div>

            {/* ── STEP 2: Payment ── */}
            <div style={{ display: step === 2 ? 'block' : 'none' }}>

              {/* Back button */}
              <button type="button" onClick={() => setStep(1)} style={{
                background: 'none', border: 'none', color: '#6366f1', fontSize: 13,
                fontWeight: 700, cursor: 'pointer', marginBottom: 16, padding: 0,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                ← Back to Address
              </button>

              {/* Address summary */}
              <div style={{
                background: 'linear-gradient(135deg,rgba(99,102,241,0.06),rgba(59,130,246,0.04))',
                border: '1.5px solid rgba(99,102,241,0.14)', borderRadius: 16, padding: '16px 20px', marginBottom: 20,
                display: 'flex', gap: 14, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 22 }}>📍</span>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e1b4b' }}>{form.name} · {form.phone}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#475569', lineHeight: 1.6 }}>
                    {[form.area, form.upazila, form.district, form.division].filter(Boolean).join(', ')}
                    {form.address && ` — ${form.address}`}
                  </p>
                </div>
                <button type="button" onClick={() => setStep(1)} style={{
                  marginLeft: 'auto', background: 'none', border: '1px solid rgba(99,102,241,0.25)',
                  color: '#6366f1', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  padding: '4px 12px', borderRadius: 8, whiteSpace: 'nowrap',
                }}>
                  Edit
                </button>
              </div>

              <SectionCard icon="💳" title="Payment Method" accent="#f59e0b">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <PaymentCard value="COD" selected={form.paymentMethod === 'COD'} onChange={(v) => setForm((p) => ({ ...p, paymentMethod: v }))}
                    icon="💵" label="Cash on Delivery (COD)" sublabel="Pay when your order arrives at your door" />
                  <PaymentCard value="bKash" selected={form.paymentMethod === 'bKash'} onChange={(v) => setForm((p) => ({ ...p, paymentMethod: v, mobileBankingProvider: 'bKash' }))}
                    icon="🔴" label="bKash" sublabel="Send money via bKash mobile banking" />
                  <PaymentCard value="Nagad" selected={form.paymentMethod === 'Nagad'} onChange={(v) => setForm((p) => ({ ...p, paymentMethod: v, mobileBankingProvider: 'Nagad' }))}
                    icon="🟠" label="Nagad" sublabel="Send money via Nagad mobile banking" />
                  <PaymentCard value="Rocket" selected={form.paymentMethod === 'Rocket'} onChange={(v) => setForm((p) => ({ ...p, paymentMethod: v, mobileBankingProvider: 'Rocket' }))}
                    icon="🟣" label="Rocket" sublabel="Send money via Rocket mobile banking" />
                </div>
              </SectionCard>

              {/* Mobile banking details */}
              {form.paymentMethod !== 'COD' && (
                <SectionCard icon="📲" title="Mobile Banking Instructions" accent="#f59e0b">
                  <div style={{
                    padding: '16px 18px', borderRadius: 14,
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.04))',
                    border: '1px solid rgba(245,158,11,0.25)', marginBottom: 18,
                  }}>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: '#92400e' }}>
                      Send ৳{total.toFixed(2)} via {form.mobileBankingProvider}
                    </p>
                    <ul style={{ margin: '10px 0 0', paddingLeft: 20, color: '#b45309', fontSize: 13, lineHeight: 1.8 }}>
                      <li>bKash: 01XXXXXXXXX (Send Money)</li>
                      <li>Nagad: 01XXXXXXXXX (Send Money)</li>
                      <li>Rocket: 01XXXXXXXXX (Send Money)</li>
                    </ul>
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: '#b45309' }}>
                      After sending, enter your Transaction ID below for verification.
                    </p>
                  </div>

                  <div>
                    <FLabel htmlFor="co-txid" required>Transaction ID</FLabel>
                    <CInput id="co-txid" placeholder={`Enter your ${form.mobileBankingProvider} Transaction ID`}
                      value={form.transactionId} onChange={set('transactionId')} required />
                  </div>
                </SectionCard>
              )}

              {/* Message */}
              {message && (
                <div style={{
                  padding: '12px 16px', borderRadius: 12, marginBottom: 16, fontSize: 13.5, fontWeight: 600,
                  background: msgIsError ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.09)',
                  color: msgIsError ? '#dc2626' : '#15803d',
                  border: msgIsError ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(34,197,94,0.2)',
                  animation: 'label-fade-in 0.3s ease forwards',
                }}>
                  {message}
                </div>
              )}

              <OrderCompleteButton status={orderStatus} disabled={loading && orderStatus === 'idle'} />
            </div>

            {/* Step 1 message */}
            {step === 1 && message && (
              <div style={{
                marginTop: 16, padding: '12px 16px', borderRadius: 12, fontSize: 13.5, fontWeight: 600,
                background: msgIsError ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.09)',
                color: msgIsError ? '#dc2626' : '#15803d',
                border: msgIsError ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(34,197,94,0.2)',
              }}>
                {message}
              </div>
            )}
          </form>

          {/* ── ORDER SUMMARY SIDEBAR ── */}
          <aside className="checkout-sidebar" style={{
            position: 'sticky', top: 24,
            background: '#fff', borderRadius: 20, overflow: 'hidden',
            boxShadow: '0 2px 16px rgba(99,102,241,0.09), 0 1px 4px rgba(0,0,0,0.04)',
            border: '1.5px solid rgba(99,102,241,0.10)',
          }}>
            {/* Sidebar header */}
            <div style={{
              background: 'linear-gradient(135deg,#6366f1,#3b82f6)',
              padding: '18px 24px',
            }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#fff' }}>Order Summary</h2>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                {totalItems} item{totalItems !== 1 ? 's' : ''} in your cart
              </p>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {/* Cart items */}
              <div style={{ marginBottom: 16, maxHeight: 200, overflowY: 'auto' }}>
                {cart.map((item) => (
                  <div key={item.cartKey || item._id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12,
                    borderBottom: '1px solid rgba(148,163,184,0.15)', marginBottom: 10,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, overflow: 'hidden',
                      background: '#f1f5f9', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>
                      {item.images?.[0] ? (
                        <img src={item.images[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : '📦'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: '#1e1b4b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                      <p style={{ margin: 0, fontSize: 11.5, color: '#64748b' }}>Qty: {item.quantity}{item.selectedWeight ? ` · ${item.selectedWeight}` : ''}</p>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e1b4b', whiteSpace: 'nowrap' }}>
                      ৳{((item.unitPrice || 0) * item.quantity).toFixed(0)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Delivery tip */}
              {totalItems > 0 && (
                <div style={{
                  padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                  background: deliveryDiscountRate > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(99,102,241,0.06)',
                  border: `1px solid ${deliveryDiscountRate > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.12)'}`,
                }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: deliveryDiscountRate > 0 ? '#059669' : '#6366f1' }}>
                    {totalItems >= 4 ? '🎉 4+ items — FREE delivery!' : totalItems >= 3 ? '✨ 3 items — 70% delivery off' : `🚀 Add ${3 - totalItems} more item${3 - totalItems !== 1 ? 's' : ''} for delivery discount`}
                  </p>
                </div>
              )}

              {/* Price breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Subtotal</span><span style={{ fontWeight: 600 }}>৳{subtotal.toFixed(2)}</span>
                </div>
                {totalItems > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Base Delivery</span><span>৳{baseDeliveryCharge.toFixed(2)}</span>
                  </div>
                )}
                {totalItems > 0 && deliveryDiscountRate > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                    <span>Delivery Discount</span><span>−৳{(baseDeliveryCharge - deliveryCharge).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Delivery</span>
                  <span style={{ fontWeight: 600, color: deliveryCharge === 0 ? '#059669' : undefined }}>
                    {deliveryCharge === 0 ? 'FREE 🎉' : `৳${deliveryCharge.toFixed(2)}`}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                    <span>Coupon ({coupon?.code})</span><span>−৳{couponDiscount.toFixed(2)}</span>
                  </div>
                )}

                {/* Total */}
                <div style={{
                  marginTop: 8, paddingTop: 14,
                  borderTop: '2px solid rgba(99,102,241,0.12)',
                  background: 'linear-gradient(135deg,rgba(99,102,241,0.06),rgba(59,130,246,0.04))',
                  borderRadius: 12, padding: '14px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#1e1b4b' }}>Total Payable</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#6366f1' }}>৳{total.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ marginTop: 18, padding: '12px 14px', borderRadius: 10, background: '#f8faff', border: '1px solid rgba(99,102,241,0.10)' }}>
                <p style={{ margin: 0, fontSize: 11.5, color: '#64748b', textAlign: 'center', lineHeight: 1.6 }}>
                  🔒 Secure & encrypted · ✅ Order confirmation via email
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .checkout-grid {
            grid-template-columns: 1fr !important;
          }
          .checkout-sidebar {
            position: static !important;
            order: -1;
          }
        }
        @media (max-width: 480px) {
          .checkout-grid {
            padding: 16px 12px !important;
          }
        }
      `}</style>
      {showPhoneVerificationModal && (
        <MobileVerificationModal
          isOpen={showPhoneVerificationModal}
          onClose={() => setShowPhoneVerificationModal(false)}
          initialPhone={form.phone || user?.phone || ''}
          userEmail={user?.email || ''}
        />
      )}
    </MarketplaceLayout>
  );
}
