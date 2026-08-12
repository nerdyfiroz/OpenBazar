import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getApiBase } from '../utils/apiBase';

const API_BASE = getApiBase();

function formatTimeRemaining(expiresAt) {
  if (!expiresAt) return null;
  const diffMs = new Date(expiresAt) - Date.now();
  if (diffMs <= 0) return 'Expired';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 24) {
    return hours <= 1 ? 'Expires in < 1h' : `Expires in ${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Expires today' : `Expires in ${days} days`;
}

export default function SmartCouponSection({
  subtotal = 0,
  totalItems = 0,
  appliedCoupon = null,
  couponDiscount = 0,
  onApplyCoupon,
  onClearCoupon,
}) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [manualMsg, setManualMsg] = useState({ text: '', isError: false });
  const [applyingCode, setApplyingCode] = useState('');

  // Fetch active public coupons
  useEffect(() => {
    let isMounted = true;
    const fetchCoupons = async () => {
      try {
        const res = await fetch(`${API_BASE}/coupons/public`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && Array.isArray(data)) {
          setCoupons(data);
        }
      } catch {
        // Fallback silently if offline/network error
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCoupons();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleApply = async (code) => {
    setApplyingCode(code);
    setManualMsg({ text: '', isError: false });
    const result = await onApplyCoupon(code, totalItems);
    setApplyingCode('');
    if (!result.ok) {
      setManualMsg({ text: result.message || 'Failed to apply coupon', isError: true });
    } else {
      setManualMsg({ text: result.message || 'Coupon applied!', isError: false });
      setManualCode('');
    }
  };

  // If a coupon is currently applied
  if (appliedCoupon) {
    return (
      <div className="mt-4 rounded-2xl border border-green-200 bg-green-50/80 p-4 text-slate-800 shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500 text-white font-bold text-lg">
              ✓
            </div>
            <div>
              <p className="font-bold text-green-800 text-sm">
                {appliedCoupon.code} Applied
              </p>
              <p className="text-xs text-green-700 font-medium">
                You saved ৳{couponDiscount.toFixed(0)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClearCoupon}
            className="rounded-lg border border-green-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 hover:border-rose-200"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  // Evaluate eligibility for each public coupon
  const processedCoupons = coupons.map((c) => {
    const minAmount = c.minOrderAmount || 0;
    const minItems = c.minItemCount || 0;

    const amountRemaining = Math.max(0, minAmount - subtotal);
    const itemsRemaining = Math.max(0, minItems - totalItems);

    const isAmountEligible = amountRemaining === 0;
    const isItemsEligible = itemsRemaining === 0;
    const isEligible = isAmountEligible && isItemsEligible;

    // Progress percentage
    let amountProgress = minAmount > 0 ? Math.min(100, (subtotal / minAmount) * 100) : 100;
    let itemsProgress = minItems > 0 ? Math.min(100, (totalItems / minItems) * 100) : 100;

    // Overall progress (weighted or minimum)
    const totalProgress = Math.min(amountProgress, itemsProgress);

    return {
      ...c,
      minAmount,
      minItems,
      amountRemaining,
      itemsRemaining,
      isAmountEligible,
      isItemsEligible,
      isEligible,
      totalProgress,
    };
  });

  // Sort coupons: Eligible first, then highest progress / closest to unlock
  processedCoupons.sort((a, b) => {
    if (a.isEligible && !b.isEligible) return -1;
    if (!a.isEligible && b.isEligible) return 1;
    return b.totalProgress - a.totalProgress;
  });

  // Find closest almost-eligible coupon (< ৳1000 remaining or close item count)
  const closestCoupon = processedCoupons.find((c) => !c.isEligible && (c.amountRemaining <= 1000 || c.itemsRemaining <= 2));

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
          <span>🎟</span> Available Offers & Coupons
        </h3>
        {loading && <span className="text-xs text-slate-400">Loading offers...</span>}
      </div>

      {/* Prominent "Almost Eligible" Banner if close to unlocking */}
      {closestCoupon && subtotal > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 text-xs text-amber-900 shadow-sm">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1 text-amber-700">
              💡 You&apos;re only {closestCoupon.amountRemaining > 0 ? `৳${closestCoupon.amountRemaining.toFixed(0)}` : `${closestCoupon.itemsRemaining} item(s)`} away!
            </span>
            <span className="rounded-md bg-amber-200/70 px-2 py-0.5 font-extrabold text-amber-800">
              {closestCoupon.code}
            </span>
          </div>
          <p className="mt-1 text-slate-700">
            {closestCoupon.type === 'percentage'
              ? `Get ${closestCoupon.value}% OFF`
              : `Save ৳${closestCoupon.value}`}{' '}
            when you unlock this offer.
          </p>
          <div className="mt-2 flex items-center justify-between">
            <div className="h-2 w-2/3 overflow-hidden rounded-full bg-amber-200/80">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${closestCoupon.totalProgress}%` }}
              />
            </div>
            <Link
              href="/category"
              className="font-bold text-amber-800 underline hover:text-amber-950"
            >
              Continue Shopping →
            </Link>
          </div>
        </div>
      )}

      {/* Offers List */}
      {processedCoupons.length > 0 ? (
        <div className="space-y-2.5">
          {processedCoupons.map((c) => {
            const timeText = formatTimeRemaining(c.expiresAt);
            const isApplyingThis = applyingCode === c.code;

            return (
              <div
                key={c.code}
                className={`group relative overflow-hidden rounded-xl border p-3.5 transition-all ${
                  c.isEligible
                    ? 'border-green-300 bg-gradient-to-r from-green-50/90 via-emerald-50/40 to-white shadow-sm hover:border-green-400'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
                style={{
                  animation: c.isEligible ? 'coupon-badge-pop 0.4s ease-out' : 'none',
                }}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black tracking-wide text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {c.code}
                      </span>
                      <span className="text-xs font-bold text-orange-600">
                        {c.type === 'percentage'
                          ? `${c.value}% OFF${c.maxDiscount ? ` (up to ৳${c.maxDiscount})` : ''}`
                          : `৳${c.value} OFF`}
                      </span>
                      {timeText && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          • {timeText}
                        </span>
                      )}
                    </div>
                  </div>

                  {c.isEligible ? (
                    <button
                      type="button"
                      disabled={isApplyingThis}
                      onClick={() => handleApply(c.code)}
                      className="flex-shrink-0 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-green-700 active:scale-95 disabled:opacity-50"
                    >
                      {isApplyingThis ? 'Applying...' : 'Apply Coupon'}
                    </button>
                  ) : (
                    <span className="flex-shrink-0 text-xs font-bold text-slate-400">
                      🔒 Locked
                    </span>
                  )}
                </div>

                {/* Status / Requirement indicators */}
                <div className="mt-2 text-xs space-y-1">
                  {c.isEligible ? (
                    <p className="font-bold text-green-700 flex items-center gap-1">
                      <span>🎉</span> You&apos;re eligible for this discount!
                    </p>
                  ) : (
                    <>
                      {/* Conditions list */}
                      <div className="space-y-1 text-slate-600 font-medium">
                        {c.minAmount > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              {c.isAmountEligible ? (
                                <span className="text-green-600 font-bold">✓ Min spend ৳{c.minAmount.toLocaleString()}</span>
                              ) : (
                                <span>○ Spend ৳{c.amountRemaining.toLocaleString()} more (Min ৳{c.minAmount.toLocaleString()})</span>
                              )}
                            </span>
                            {!c.isAmountEligible && (
                              <span className="text-[11px] text-slate-400">
                                ৳{subtotal.toLocaleString()} / ৳{c.minAmount.toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}

                        {c.minItems > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              {c.isItemsEligible ? (
                                <span className="text-green-600 font-bold">✓ Min {c.minItems} items requirement met</span>
                              ) : (
                                <span>○ Add {c.itemsRemaining} more item{c.itemsRemaining > 1 ? 's' : ''} (Min {c.minItems})</span>
                              )}
                            </span>
                            {!c.isItemsEligible && (
                              <span className="text-[11px] text-slate-400">
                                {totalItems} / {c.minItems} items
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500 transition-all duration-500"
                          style={{
                            width: `${c.totalProgress}%`,
                            animation: 'coupon-bar-fill 0.6s ease-out',
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !loading && (
          <p className="text-xs text-slate-500 italic">
            No public promotions active right now. Enter a promo code below if you have one.
          </p>
        )
      )}

      {/* Manual Code Input Fallback */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
        <p className="mb-1.5 text-xs font-semibold text-slate-600">Have a promo code?</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (manualCode.trim()) handleApply(manualCode.trim());
          }}
          className="flex gap-2"
        >
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            placeholder="Enter promo code"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono font-bold uppercase outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-300"
          />
          <button
            type="submit"
            disabled={!manualCode.trim() || applyingCode === manualCode.trim()}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {applyingCode === manualCode.trim() ? '...' : 'Apply'}
          </button>
        </form>
        {manualMsg.text && (
          <p
            className={`mt-1.5 text-xs font-medium ${
              manualMsg.isError ? 'text-rose-600' : 'text-green-600'
            }`}
          >
            {manualMsg.text}
          </p>
        )}
      </div>
    </div>
  );
}
