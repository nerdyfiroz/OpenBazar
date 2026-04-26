import { useEffect, useMemo, useState } from 'react';
import MarketplaceLayout from '../../components/MarketplaceLayout';
import { resolveImageSrc, FALLBACK_IMAGE } from '../../utils/resolveImageSrc';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';
const CATEGORIES = ['Electronics', 'Fashion', 'Beauty', 'Home & Living', 'Sports'];

const blankForm = {
  name: '', description: '', category: '', brand: '', price: '',
  saleType: 'regular', salePercent: '', discountPrice: '',
  preorderStartAt: '', preorderEndAt: '', saleStartAt: '', saleEndAt: '',
  colors: '', sizes: '', accessories: '', specifications: ''
};

// ─── Status badge colours ────────────────────────────────────────────────────
const STATUS_COLOR = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700'
};

export default function SellerDashboard() {
  const [token, setToken] = useState(null);
  const [tab, setTab] = useState('overview'); // overview | products | orders | add
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderStats, setOrderStats] = useState({ totalOrders: 0, totalRevenue: 0, totalSold: 0 });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── product form state ──
  const [form, setForm] = useState(blankForm);
  const [photos, setPhotos] = useState([]);
  const [video, setVideo] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // ── delete confirm ──
  const [confirmDelete, setConfirmDelete] = useState(null);

  const setF = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const productStats = useMemo(() => ({
    total: products.length,
    approved: products.filter((p) => p.isApproved).length,
    pending: products.filter((p) => !p.isApproved).length
  }), [products]);

  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  // ── loaders ──────────────────────────────────────────────────────────────
  const loadProducts = async (tk) => {
    try {
      const res = await fetch(`${API_BASE}/products/seller/mine`, { headers: { Authorization: `Bearer ${tk}` } });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch { setProducts([]); }
  };

  const loadOrders = async (tk) => {
    try {
      const res = await fetch(`${API_BASE}/orders/seller`, { headers: { Authorization: `Bearer ${tk}` } });
      const data = await res.json();
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      if (data.stats) setOrderStats(data.stats);
    } catch { setOrders([]); }
  };

  useEffect(() => {
    const tk = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setToken(tk);
    if (tk) {
      setLoading(true);
      Promise.all([loadProducts(tk), loadOrders(tk)]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ── submit product (create or edit) ──────────────────────────────────────
  const submitProduct = async (e) => {
    e.preventDefault();
    if (!token) return setMsg('Please login as a seller first.');
    setSubmitting(true);
    setMsg('');
    try {
      const fd = new FormData();
      Object.entries({
        ...form,
        price: Number(form.price),
        salePercent: form.salePercent === '' ? 0 : Number(form.salePercent),
        discountPrice: form.discountPrice === '' ? '' : Number(form.discountPrice),
        colors: form.colors, sizes: form.sizes, accessories: form.accessories
      }).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) fd.append(k, v); });

      photos.slice(0, 3).forEach((f) => fd.append('photos', f));
      if (video) fd.append('video', video);

      const url = editingId ? `${API_BASE}/products/${editingId}` : `${API_BASE}/products`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: authHeader, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');

      setMsg(data.message || (editingId ? 'Product updated' : 'Product submitted for approval'));
      setForm(blankForm); setPhotos([]); setVideo(null); setEditingId(null);
      setTab('products');
      await loadProducts(token);
    } catch (err) {
      setMsg(err.message || 'Failed to save product');
    } finally { setSubmitting(false); }
  };

  // ── delete ────────────────────────────────────────────────────────────────
  const deleteProduct = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE', headers: authHeader });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMsg('Product deleted.');
      setProducts((p) => p.filter((x) => x._id !== id));
    } catch (err) { setMsg(err.message || 'Delete failed'); }
    setConfirmDelete(null);
  };

  // ── start edit ────────────────────────────────────────────────────────────
  const startEdit = (p) => {
    setForm({
      name: p.name || '', description: p.description || '',
      category: p.category || '', brand: p.brand || '',
      price: p.price ?? '', saleType: p.saleType || 'regular',
      salePercent: p.salePercent ?? '', discountPrice: p.discountPrice ?? '',
      preorderStartAt: p.preorderStartAt ? p.preorderStartAt.slice(0, 16) : '',
      preorderEndAt: p.preorderEndAt ? p.preorderEndAt.slice(0, 16) : '',
      saleStartAt: p.saleStartAt ? p.saleStartAt.slice(0, 16) : '',
      saleEndAt: p.saleEndAt ? p.saleEndAt.slice(0, 16) : '',
      colors: (p.colors || []).join(', '), sizes: (p.sizes || []).join(', '),
      accessories: (p.accessories || []).join(', '), specifications: p.specifications || ''
    });
    setEditingId(p._id);
    setPhotos([]); setVideo(null);
    setTab('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── nav tabs ──────────────────────────────────────────────────────────────
  const tabs = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'products', label: '📦 My Products' },
    { key: 'orders', label: '🛒 Orders' },
    { key: 'add', label: editingId ? '✏️ Edit Product' : '➕ Add Product' }
  ];

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-7xl px-4 py-8">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black">Seller Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Manage your products, track sales and orders.</p>
          </div>
          {editingId && (
            <button onClick={() => { setEditingId(null); setForm(blankForm); setTab('products'); }}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
              ✕ Cancel Edit
            </button>
          )}
        </div>

        {msg && (
          <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
            {msg} <button className="ml-3 text-orange-400 hover:text-orange-600" onClick={() => setMsg('')}>✕</button>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-slate-200">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-semibold transition ${tab === t.key ? 'border-b-2 border-orange-500 text-orange-600' : 'text-slate-500 hover:text-slate-800'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <StatCard label="Total Products" value={productStats.total} color="bg-orange-500" />
              <StatCard label="Approved" value={productStats.approved} color="bg-green-500" />
              <StatCard label="Pending" value={productStats.pending} color="bg-yellow-500" />
              <StatCard label="Total Orders" value={orderStats.totalOrders} color="bg-indigo-500" />
              <StatCard label="Units Sold" value={orderStats.totalSold} color="bg-purple-500" />
              <StatCard label="Revenue" value={`৳${Number(orderStats.totalRevenue).toFixed(0)}`} color="bg-emerald-500" />
            </div>

            {/* Recent orders mini list */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-bold">Recent Orders</h2>
              {orders.length === 0 ? (
                <p className="text-sm text-slate-500">No orders yet.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {orders.slice(0, 5).map((o) => (
                    <div key={o._id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                      <div>
                        <p className="font-medium">{o.customer?.name || 'Customer'}</p>
                        <p className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-orange-600">৳{Number(o.myRevenue || 0).toFixed(0)}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[o.status] || 'bg-slate-100 text-slate-600'}`}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PRODUCTS ─────────────────────────────────────────────────────── */}
        {tab === 'products' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Your Products ({products.length})</h2>
              <div className="flex gap-2">
                <button onClick={() => loadProducts(token)} className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50">Refresh</button>
                <button onClick={() => { setForm(blankForm); setEditingId(null); setTab('add'); }} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">+ Add Product</button>
              </div>
            </div>
            {loading ? <p className="text-sm text-slate-500">Loading...</p>
              : !products.length ? <p className="text-sm text-slate-500">No products yet.</p>
              : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {products.map((p) => (
                    <article key={p._id} className="rounded-xl border border-slate-200 p-4 shadow-sm">
                      <img
                        src={resolveImageSrc(p.images?.[0] || p.photos?.[0])}
                        alt={p.name}
                        className="mb-3 h-40 w-full rounded-lg object-cover"
                        onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                      />
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold leading-tight">{p.name}</h3>
                          <p className="text-xs text-slate-500">{p.brand} · {p.category}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${p.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {p.isApproved ? 'Live' : 'Pending'}
                        </span>
                      </div>
                      <div className="mt-2 text-sm">
                        <p><strong>Price:</strong> ৳{Number(p.price || 0).toFixed(0)} {p.discountPrice ? `→ ৳${Number(p.discountPrice).toFixed(0)}` : ''}</p>
                        <p><strong>Sold:</strong> {p.soldCount || 0} units</p>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => startEdit(p)} className="flex-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">✏️ Edit</button>
                        <button onClick={() => setConfirmDelete(p._id)} className="flex-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">🗑 Delete</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* ── ORDERS ───────────────────────────────────────────────────────── */}
        {tab === 'orders' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-bold">Orders ({orders.length})</h2>
            {orders.length === 0 ? <p className="text-sm text-slate-500">No orders yet.</p> : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <OrderRow key={o._id} order={o} token={token} apiBase={API_BASE} statusColor={STATUS_COLOR} onMsg={setMsg} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ADD / EDIT FORM ───────────────────────────────────────────────── */}
        {tab === 'add' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
            {editingId && <p className="mt-1 text-xs text-amber-600">⚠ Editing will reset approval status — admin must re-approve.</p>}

            <form onSubmit={submitProduct} className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="Product Name" value={form.name} onChange={(v) => setF('name', v)} required />
              <Field label="Brand" value={form.brand} onChange={(v) => setF('brand', v)} placeholder="e.g. Samsung" />

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
                <select className="input" value={form.category} onChange={(e) => setF('category', e.target.value)} required>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <Field label="Base Price (৳)" type="number" min="0" value={form.price} onChange={(v) => setF('price', v)} required />

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Product Type</label>
                <select className="input" value={form.saleType} onChange={(e) => setF('saleType', e.target.value)}>
                  <option value="regular">Regular</option>
                  <option value="sale">On Sale</option>
                  <option value="preorder">Preorder</option>
                </select>
              </div>

              <Field label="Sale % Off" type="number" min="0" max="100" value={form.salePercent} onChange={(v) => setF('salePercent', v)} placeholder="e.g. 10" />
              <Field label="Discount Price (৳)" type="number" min="0" value={form.discountPrice} onChange={(v) => setF('discountPrice', v)} placeholder="Optional if % set" />
              <Field label="Sale Start" type="datetime-local" value={form.saleStartAt} onChange={(v) => setF('saleStartAt', v)} />
              <Field label="Sale End" type="datetime-local" value={form.saleEndAt} onChange={(v) => setF('saleEndAt', v)} />
              <Field label="Preorder Start" type="datetime-local" value={form.preorderStartAt} onChange={(v) => setF('preorderStartAt', v)} />
              <Field label="Preorder End" type="datetime-local" value={form.preorderEndAt} onChange={(v) => setF('preorderEndAt', v)} />

              <TextArea label="Description" value={form.description} onChange={(v) => setF('description', v)} className="md:col-span-2" />
              <TextArea label="Specifications" value={form.specifications} onChange={(v) => setF('specifications', v)} className="md:col-span-2" />

              <Field label="Colors (comma separated)" value={form.colors} onChange={(v) => setF('colors', v)} placeholder="Red, Blue" className="md:col-span-2" />
              <Field label="Sizes (comma separated)" value={form.sizes} onChange={(v) => setF('sizes', v)} placeholder="S, M, L, XL" className="md:col-span-2" />
              <Field label="Accessories (comma separated)" value={form.accessories} onChange={(v) => setF('accessories', v)} placeholder="Case, Charger" className="md:col-span-2" />

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Photos (up to 3)</label>
                <input className="input" type="file" accept="image/*" multiple onChange={(e) => setPhotos(Array.from(e.target.files || []).slice(0, 3))} />
                {editingId && <p className="mt-1 text-xs text-slate-400">Leave empty to keep existing photos.</p>}
                {photos.length > 0 && <p className="mt-1 text-xs text-slate-600">{photos.map((f) => f.name).join(', ')}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Video (1 file, max 10 MB)</label>
                <input className="input" type="file" accept="video/*" onChange={(e) => setVideo((e.target.files || [])[0] || null)} />
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button type="submit" disabled={submitting}
                  className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
                  {submitting ? 'Saving...' : (editingId ? 'Save Changes' : 'Submit Product')}
                </button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setForm(blankForm); setTab('products'); }}
                    className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ── DELETE CONFIRM MODAL ─────────────────────────────────────────── */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-slate-800">Delete Product?</h3>
              <p className="mt-2 text-sm text-slate-600">This cannot be undone. The listing will be permanently removed.</p>
              <div className="mt-5 flex gap-3">
                <button onClick={() => deleteProduct(confirmDelete)} className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700">Yes, Delete</button>
                <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-xl border border-slate-300 py-2 text-sm font-semibold hover:bg-slate-50">Cancel</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </MarketplaceLayout>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className={`rounded-2xl p-4 text-white shadow-sm ${color}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function Field({ label, className = '', onChange, ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input className="input" {...props} onChange={(e) => onChange?.(e.target.value)} />
    </label>
  );
}

function TextArea({ label, className = '', onChange, ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <textarea className="input min-h-[100px]" {...props} onChange={(e) => onChange?.(e.target.value)} />
    </label>
  );
}

const COURIERS = ['Pathao', 'Steadfast', 'RedX', 'eCourier', 'Sundarban', 'SA Paribahan', 'Janani', 'Other'];

function OrderRow({ order: o, token, apiBase, statusColor, onMsg }) {
  const [open, setOpen] = useState(false);
  const [tracking, setTracking] = useState({
    courierService: o.tracking?.courierService || '',
    trackingId: o.tracking?.trackingId || '',
    trackingUrl: o.tracking?.trackingUrl || ''
  });
  const [saving, setSaving] = useState(false);

  const saveTracking = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/orders/seller/${o._id}/tracking`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(tracking)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      onMsg('✅ Tracking info saved successfully!');
    } catch (err) {
      onMsg(err.message || 'Failed to save tracking');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full cursor-pointer flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm font-medium hover:bg-slate-50"
      >
        <span className="text-left">{o.customer?.name || 'Customer'} · {new Date(o.createdAt).toLocaleDateString()}</span>
        <div className="flex items-center gap-3">
          <span className="font-bold text-orange-600">৳{Number(o.myRevenue || 0).toFixed(0)}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[o.status] || 'bg-slate-100 text-slate-600'}`}>{o.status}</span>
          <span className="text-slate-400">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4">
          {/* Order info */}
          <div className="text-sm text-slate-700 space-y-1">
            <p><strong>Payment:</strong> {o.paymentMethod}</p>
            <p><strong>Address:</strong> {o.shippingAddress?.fullAddress || '—'}</p>
            <ul className="mt-2 space-y-1 border border-slate-100 rounded-lg p-2 bg-slate-50">
              {(o.myItems || []).map((item, i) => (
                <li key={i} className="flex justify-between text-xs">
                  <span>{item.name || 'Product'} × {item.quantity || 1}</span>
                  <span>৳{(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(0)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tracking form */}
          <div className="rounded-xl bg-orange-50 border border-orange-200 p-4">
            <p className="mb-3 text-sm font-bold text-orange-700">🚚 Set Courier Tracking</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Courier Service</label>
                <select className="input text-sm" value={tracking.courierService}
                  onChange={(e) => setTracking((t) => ({ ...t, courierService: e.target.value }))}>
                  <option value="">Select courier</option>
                  {COURIERS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Parcel / Waybill ID</label>
                <input className="input text-sm font-mono" placeholder="e.g. PH-1234567"
                  value={tracking.trackingId}
                  onChange={(e) => setTracking((t) => ({ ...t, trackingId: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Tracking URL (optional)</label>
                <input className="input text-sm" placeholder="https://steadfast.com.bd/track?id=..."
                  value={tracking.trackingUrl}
                  onChange={(e) => setTracking((t) => ({ ...t, trackingUrl: e.target.value }))} />
              </div>
            </div>
            <button onClick={saveTracking} disabled={saving || !tracking.trackingId}
              className="mt-3 rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-50">
              {saving ? 'Saving...' : '💾 Save Tracking'}
            </button>
            {tracking.trackingId && (
              <p className="mt-2 text-xs text-green-600">✓ Tracking ID set — buyer can see this on their orders page.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
