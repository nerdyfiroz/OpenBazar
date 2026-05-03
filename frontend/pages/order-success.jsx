import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import MarketplaceLayout from '../components/MarketplaceLayout';
import { useStore } from '../components/StoreProvider';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

export default function OrderSuccess() {
  const router = useRouter();
  const { clearCoupon } = useStore();
  const { orderId } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear coupon on success arrival
    clearCoupon?.();
  }, []);

  useEffect(() => {
    if (!orderId) return;
    fetch(`${API_BASE}/orders/track/${orderId}`)
      .then((r) => r.json())
      .then((data) => { if (data._id) setOrder(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        {/* Animated checkmark */}
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
          <svg className="h-12 w-12 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="mt-6 text-3xl font-black text-slate-800">Order Placed! 🎉</h1>
        <p className="mt-2 text-slate-500">Thank you for your purchase. We&apos;ve received your order and will process it shortly.</p>

        {orderId && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm">
            <p className="text-xs text-slate-400">Order ID</p>
            <p className="mt-0.5 font-mono text-sm font-bold text-slate-700">{orderId}</p>

            {!loading && order && (
              <>
                <div className="mt-4 space-y-1 text-sm">
                  {(order.products || []).map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-slate-600">{item.name || item.product?.name || 'Product'} × {item.quantity || 1}</span>
                      <span className="font-semibold">৳{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 border-t border-slate-100 pt-3 text-sm">
                  <div className="flex justify-between font-black text-slate-800">
                    <span>Total Paid</span>
                    <span className="text-orange-600">৳{Number(order.total || 0).toFixed(0)}</span>
                  </div>
                </div>
                <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  💳 Payment: <strong>{order.paymentMethod}</strong>
                  {order.paymentMethod !== 'COD' && ' — awaiting verification'}
                </div>
              </>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {orderId && (
            <Link href={`/track/${orderId}`}
              className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600">
              🔍 Track My Order
            </Link>
          )}
          <Link href="/user/orders"
            className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold hover:bg-slate-50">
            📦 View All Orders
          </Link>
          <Link href="/category"
            className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold hover:bg-slate-50">
            🛍️ Continue Shopping
          </Link>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          A confirmation will be sent to your email. Questions? <Link href="/contact" className="text-orange-500 hover:underline">Contact us</Link>
        </p>
      </main>
    </MarketplaceLayout>
  );
}
