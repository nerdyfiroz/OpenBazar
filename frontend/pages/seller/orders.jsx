import { useEffect, useState } from 'react';
import Link from 'next/link';
import MarketplaceLayout from '../../components/MarketplaceLayout';
import { useStore } from '../../components/StoreProvider';
import SEO from '../../components/SEO';
import { resolveImageSrc } from '../../utils/resolveImageSrc';
import SmartImage from '../../components/SmartImage';
import { getApiBase, safeJson } from '../../utils/apiBase';

const API_BASE = getApiBase();

const STATUS_COLOR = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  paid: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  processing: 'bg-purple-100 text-purple-800 border-purple-200',
  shipped: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-rose-100 text-rose-800 border-rose-200'
};

const COURIERS = ['Pathao', 'Steadfast', 'RedX', 'eCourier', 'Sundarban', 'SA Paribahan', 'Janani', 'Other'];

export default function SellerOrdersPage() {
  const { user } = useStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [msg, setMsg] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const loadOrders = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/orders/seller`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [token]);

  const filteredOrders = orders.filter((o) => {
    if (filter === 'all') return true;
    return o.status === filter;
  });

  return (
    <MarketplaceLayout>
      <SEO title="Seller Orders — OpenBazar" description="Manage incoming customer orders" canonical="/seller/orders" noindex />

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/seller/dashboard" className="text-xs font-bold text-indigo-600 hover:underline">
                ← Back to Seller Dashboard
              </Link>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Order Fulfillment Hub
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review customer purchases, assign courier tracking IDs, and generate tax invoices.
            </p>
          </div>

          <button
            onClick={loadOrders}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            🔄 Refresh Orders
          </button>
        </div>

        {msg && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 flex justify-between items-center">
            <span>{msg}</span>
            <button onClick={() => setMsg('')} className="text-emerald-500">✕</button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => {
            const count = st === 'all' ? orders.length : orders.filter(o => o.status === st).length;
            return (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-black capitalize transition ${
                  filter === st
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="py-20 text-center text-xs font-bold text-slate-400">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white py-16 text-center shadow-xs">
            <p className="text-4xl mb-2">📦</p>
            <h3 className="text-sm font-bold text-slate-800">No orders found</h3>
            <p className="text-xs text-slate-400 mt-1">There are no orders matching this filter right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <SellerOrderCard
                key={order._id}
                order={order}
                token={token}
                isOpen={expandedId === order._id}
                onToggle={() => setExpandedId(expandedId === order._id ? null : order._id)}
                onMsg={setMsg}
                onReload={loadOrders}
              />
            ))}
          </div>
        )}

      </main>
    </MarketplaceLayout>
  );
}

function SellerOrderCard({ order: o, token, isOpen, onToggle, onMsg, onReload }) {
  const [status, setStatus] = useState(o.status || 'pending');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [tracking, setTracking] = useState({
    courierService: o.tracking?.courierService || '',
    trackingId: o.tracking?.trackingId || '',
    trackingUrl: o.tracking?.trackingUrl || ''
  });
  const [saving, setSaving] = useState(false);

  const handleStatusChange = async (nextStatus) => {
    setUpdatingStatus(true);
    try {
      let res = await fetch(`${API_BASE}/orders/seller/${o._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.status === 404) {
        res = await fetch(`${API_BASE}/orders/admin/${o._id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: nextStatus })
        });
      }
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || 'Failed');
      setStatus(nextStatus);
      onMsg(`✅ Order status updated to ${nextStatus.toUpperCase()}`);
      onReload?.();
    } catch (err) {
      onMsg(err.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const saveTracking = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/orders/seller/${o._id}/tracking`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(tracking)
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || 'Failed');
      onMsg('✅ Courier tracking info updated successfully!');
      onReload?.();
    } catch (err) {
      onMsg(err.message || 'Failed to save tracking');
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs transition hover:shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 md:p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black text-indigo-600">
              #{String(o._id).slice(-8).toUpperCase()}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-bold text-slate-700">
              {o.customer?.name || 'Customer'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {new Date(o.createdAt).toLocaleString('en-BD')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400">Your Share</p>
            <p className="text-base font-black text-slate-900">৳{Number(o.myRevenue || 0).toFixed(0)}</p>
          </div>

          <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${STATUS_COLOR[o.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            {o.status}
          </span>

          {o.status === 'pending' && (
            <button
              onClick={() => handleStatusChange('confirmed')}
              disabled={updatingStatus}
              className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-indigo-700 shadow-xs disabled:opacity-50"
            >
              ✅ Confirm
            </button>
          )}

          <button
            onClick={onToggle}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            {isOpen ? 'Hide' : 'Manage'}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-5 md:p-6 space-y-5">
          {/* Status Progression Controls */}
          <div className="rounded-2xl bg-indigo-50/80 border border-indigo-200 p-4">
            <p className="text-xs font-black text-indigo-900 mb-2">⚡ Order Status Workflow</p>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mb-3">
              {o.status === 'pending' && (
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange('confirmed')}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                >
                  ✅ Confirm Order
                </button>
              )}
              {o.status === 'confirmed' && (
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange('processing')}
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-black text-white shadow-xs hover:bg-purple-700 disabled:opacity-50"
                >
                  📦 Mark as Processing / Packing
                </button>
              )}
              {o.status === 'processing' && (
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange('shipped')}
                  className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-black text-white shadow-xs hover:bg-cyan-700 disabled:opacity-50"
                >
                  🚚 Mark as Shipped (Parcel Dispatched)
                </button>
              )}
              {o.status === 'shipped' && (
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange('delivered')}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                >
                  🎉 Mark as Delivered
                </button>
              )}
              {['pending', 'confirmed'].includes(o.status) && (
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this order?')) handleStatusChange('cancelled');
                  }}
                  className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                >
                  ❌ Cancel
                </button>
              )}
            </div>

            {/* Custom status selector */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-indigo-100">
              <span className="text-[11px] font-bold text-indigo-700">Set Custom Status:</span>
              <select
                className="rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
                  <option key={st} value={st}>{st.toUpperCase()}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={updatingStatus || status === o.status}
                onClick={() => handleStatusChange(status)}
                className="rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {updatingStatus ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>

          {/* Item details */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Ordered Items ({o.myItems?.length || 0})</h4>
            <div className="space-y-2 bg-white rounded-2xl p-4 border border-slate-100">
              {(o.myItems || []).map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div className="font-bold text-slate-800">
                    {item.name || 'Product'} <span className="text-slate-400 font-normal">× {item.quantity || 1}</span>
                  </div>
                  <div className="font-black text-slate-900">
                    ৳{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping & Payment details */}
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black uppercase text-indigo-600 tracking-wider mb-1">SHIPPING ADDRESS</p>
              <p className="font-bold text-slate-800">{o.shippingAddress?.fullName || o.customer?.name || 'Customer'}</p>
              <p className="text-slate-600 mt-0.5">{o.shippingAddress?.fullAddress || 'Address on file'}</p>
              {o.shippingAddress?.phone && <p className="text-slate-500 mt-1">📞 {o.shippingAddress.phone}</p>}
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black uppercase text-indigo-600 tracking-wider mb-1">PAYMENT & METHOD</p>
              <p className="font-bold text-slate-800">{o.paymentMethod}</p>
              {o.paymentInfo?.transactionId && (
                <p className="font-mono text-slate-500 mt-1">TXID: {o.paymentInfo.transactionId}</p>
              )}
            </div>
          </div>

          {/* Courier Assignment */}
          <div className="bg-gradient-to-r from-blue-50/60 to-indigo-50/60 p-4 rounded-2xl border border-indigo-100">
            <p className="text-xs font-black text-indigo-900 mb-2">🚚 Assign Courier Dispatch</p>
            <div className="grid sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Courier Service</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs outline-none"
                  value={tracking.courierService}
                  onChange={(e) => setTracking((t) => ({ ...t, courierService: e.target.value }))}
                >
                  <option value="">Select courier</option>
                  {COURIERS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Parcel / Waybill Tracking ID</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-mono outline-none"
                  placeholder="e.g. PH-9840294"
                  value={tracking.trackingId}
                  onChange={(e) => setTracking((t) => ({ ...t, trackingId: e.target.value }))}
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={saveTracking}
                disabled={saving || !tracking.trackingId}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-black text-white shadow-xs hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : '💾 Update Courier Tracking'}
              </button>

              <a
                href={`/invoice/${o._id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-xs font-black text-indigo-700 shadow-xs hover:bg-indigo-50"
              >
                <span>📄</span>
                <span>Print Tax Invoice</span>
              </a>
            </div>
          </div>

        </div>
      )}
    </article>
  );
}
