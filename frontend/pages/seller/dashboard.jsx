import { useEffect, useMemo, useState } from 'react';
import MarketplaceLayout from '../../components/MarketplaceLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

const initialForm = {
  name: '',
  description: '',
  category: '',
  brand: '',
  price: '',
  saleType: 'regular',
  salePercent: '',
  discountPrice: '',
  preorderStartAt: '',
  preorderEndAt: '',
  saleStartAt: '',
  saleEndAt: '',
  colors: '',
  sizes: '',
  accessories: '',
  specifications: ''
};

export default function SellerDashboard() {
  const [token, setToken] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState(initialForm);
  const [photos, setPhotos] = useState([]);
  const [video, setVideo] = useState(null);

  const stats = useMemo(() => {
    const total = products.length;
    const approved = products.filter((p) => p.isApproved).length;
    const pending = total - approved;
    return { total, approved, pending };
  }, [products]);

  const parseList = (value) =>
    String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const loadProducts = async (authToken) => {
    if (!authToken) {
      setMessage('Please login as a seller first.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/products/seller/mine`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to load products');

      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setMessage(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const authToken = typeof window === 'undefined' ? null : localStorage.getItem('token');
    setToken(authToken);
    loadProducts(authToken);
  }, []);

  const submitProduct = async (e) => {
    e.preventDefault();
    if (!token) {
      setMessage('Please login as a seller first.');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      if (photos.length > 3) {
        throw new Error('You can upload up to 3 photos only');
      }

      if (video && video.size > 10 * 1024 * 1024) {
        throw new Error('Video must be 10 MB or smaller');
      }

      const formData = new FormData();
      Object.entries({
        ...form,
        price: Number(form.price),
        salePercent: form.salePercent === '' ? 0 : Number(form.salePercent),
        discountPrice: form.discountPrice === '' ? '' : Number(form.discountPrice),
        colors: parseList(form.colors).join(','),
        sizes: parseList(form.sizes).join(','),
        accessories: parseList(form.accessories).join(',')
      }).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      photos.slice(0, 3).forEach((file) => formData.append('photos', file));
      if (video) formData.append('video', video);

      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : { message: await res.text() };
      if (!res.ok) throw new Error(data.message || 'Failed to create product');

      setMessage(data.message || 'Product submitted for approval');
      setForm(initialForm);
      setPhotos([]);
      setVideo(null);
      await loadProducts(token);
    } catch (err) {
      setMessage(err.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-black">Seller Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Add regular products, sale items, preorder listings, and variants like colors, sizes, and accessories.
          </p>
        </div>

        {message && (
          <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
            {message}
          </div>
        )}

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <StatCard label="Total Products" value={stats.total} />
          <StatCard label="Approved" value={stats.approved} />
          <StatCard label="Pending Approval" value={stats.pending} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Create Product</h2>
            <p className="mt-1 text-sm text-slate-500">
              Fields like colors, sizes, accessories, preorder windows, and sale percentage are supported.
            </p>

            <form onSubmit={submitProduct} className="mt-4 grid gap-3 md:grid-cols-2">
              <Input label="Product Name" value={form.name} onChange={(value) => setForm((p) => ({ ...p, name: value }))} required />
              <Input label="Brand" value={form.brand} onChange={(value) => setForm((p) => ({ ...p, brand: value }))} placeholder="e.g. Samsung" />
              <Input label="Category" value={form.category} onChange={(value) => setForm((p) => ({ ...p, category: value }))} placeholder="e.g. Electronics" />
              <Input label="Base Price" type="number" min="0" value={form.price} onChange={(value) => setForm((p) => ({ ...p, price: value }))} required />

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Product Type</label>
                <select
                  className="input"
                  value={form.saleType}
                  onChange={(e) => setForm((p) => ({ ...p, saleType: e.target.value }))}
                >
                  <option value="regular">Regular</option>
                  <option value="sale">On Sale</option>
                  <option value="preorder">Preorder</option>
                </select>
              </div>

              <Input
                label="Sale % Off"
                type="number"
                min="0"
                max="100"
                value={form.salePercent}
                onChange={(value) => setForm((p) => ({ ...p, salePercent: value }))}
                placeholder="e.g. 15"
              />
              <Input
                label="Discount Price"
                type="number"
                min="0"
                value={form.discountPrice}
                onChange={(value) => setForm((p) => ({ ...p, discountPrice: value }))}
                placeholder="Optional if percent is set"
              />

              <Input label="Sale Start At" type="datetime-local" value={form.saleStartAt} onChange={(value) => setForm((p) => ({ ...p, saleStartAt: value }))} />
              <Input label="Sale End At" type="datetime-local" value={form.saleEndAt} onChange={(value) => setForm((p) => ({ ...p, saleEndAt: value }))} />
              <Input label="Preorder Start At" type="datetime-local" value={form.preorderStartAt} onChange={(value) => setForm((p) => ({ ...p, preorderStartAt: value }))} />
              <Input label="Preorder End At" type="datetime-local" value={form.preorderEndAt} onChange={(value) => setForm((p) => ({ ...p, preorderEndAt: value }))} />

              <TextArea
                label="Description"
                value={form.description}
                onChange={(value) => setForm((p) => ({ ...p, description: value }))}
                className="md:col-span-2"
              />
              <TextArea
                label="Specifications"
                value={form.specifications}
                onChange={(value) => setForm((p) => ({ ...p, specifications: value }))}
                className="md:col-span-2"
              />

              <Input
                label="Colors (comma separated)"
                value={form.colors}
                onChange={(value) => setForm((p) => ({ ...p, colors: value }))}
                placeholder="Red, Blue, Black"
                className="md:col-span-2"
              />
              <Input
                label="Sizes (comma separated)"
                value={form.sizes}
                onChange={(value) => setForm((p) => ({ ...p, sizes: value }))}
                placeholder="S, M, L, XL"
                className="md:col-span-2"
              />
              <Input
                label="Accessories / Add-ons (comma separated)"
                value={form.accessories}
                onChange={(value) => setForm((p) => ({ ...p, accessories: value }))}
                placeholder="Case, Charger, Extra Strap"
                className="md:col-span-2"
              />
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Product Photos (up to 3)</label>
                <input
                  className="input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setPhotos(files.slice(0, 3));
                    if (files.length > 3) {
                      setMessage('You can upload up to 3 photos only');
                    }
                  }}
                />
                <p className="mt-1 text-xs text-slate-500">Upload up to 3 photos to show the real condition of the product.</p>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Product Video (1 file, max 10 MB)</label>
                <input
                  className="input"
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const selectedVideo = (e.target.files || [])[0] || null;
                    setVideo(selectedVideo);
                    if (selectedVideo && selectedVideo.size > 10 * 1024 * 1024) {
                      setMessage('Video must be 10 MB or smaller');
                    }
                  }}
                />
                <p className="mt-1 text-xs text-slate-500">Add one short video to describe the product’s real condition.</p>
              </div>

              {photos.length > 0 && (
                <div className="md:col-span-2 text-xs text-slate-600">
                  <strong>Selected photos:</strong> {photos.map((file) => file.name).join(', ')}
                </div>
              )}
              {video && (
                <div className="md:col-span-2 text-xs text-slate-600">
                  <strong>Selected video:</strong> {video.name} ({(video.size / (1024 * 1024)).toFixed(2)} MB)
                </div>
              )}

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-70"
                >
                  {submitting ? 'Submitting...' : 'Submit Product'}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">Seller Tips</h2>
            <ul className="mt-3 space-y-3 text-sm text-slate-600">
              <li>• Use <strong>sale</strong> for discount campaigns with % off or custom discount price.</li>
              <li>• Use <strong>preorder</strong> for items that need a booking window before delivery.</li>
              <li>• Add <strong>colors, sizes, and accessories</strong> as comma-separated lists.</li>
              <li>• New products go to <strong>pending approval</strong> until an admin approves them.</li>
            </ul>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Your Products</h2>
              <p className="text-sm text-slate-500">Everything you’ve added so far.</p>
            </div>
            <button
              type="button"
              onClick={() => loadProducts(token)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading products...</p>
          ) : !products.length ? (
            <p className="text-sm text-slate-500">No products yet. Create your first listing above.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <article key={product._id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-xs text-slate-500">{product.brand || 'Generic'} · {product.category || 'Uncategorized'}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold uppercase">
                      {product.saleType || 'regular'}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-600 line-clamp-3">
                    {product.description || 'No description yet.'}
                  </p>

                  <div className="mt-3 text-sm">
                    <p><strong>Price:</strong> ৳{Number(product.price || 0).toFixed(2)}</p>
                    <p><strong>Discount:</strong> {product.discountPrice ? `৳${Number(product.discountPrice).toFixed(2)}` : 'None'}</p>
                    <p><strong>Sale %:</strong> {Number(product.salePercent || 0)}%</p>
                    <p><strong>Status:</strong> {product.isApproved ? 'Approved' : 'Pending approval'}</p>
                  </div>

                  <div className="mt-3 space-y-2 text-xs text-slate-600">
                    <DetailRow label="Colors" value={product.colors} />
                    <DetailRow label="Sizes" value={product.sizes} />
                    <DetailRow label="Accessories" value={product.accessories} />
                  </div>

                  <div className="mt-3 text-xs text-slate-500 space-y-1">
                    <p>Sale window: {formatRange(product.saleStartAt, product.saleEndAt)}</p>
                    <p>Preorder window: {formatRange(product.preorderStartAt, product.preorderEndAt)}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </MarketplaceLayout>
  );
}

function Input({ label, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input className="input" {...props} />
    </label>
  );
}

function TextArea({ label, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <textarea className="input min-h-[110px]" {...props} />
    </label>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }) {
  const items = Array.isArray(value) ? value.filter(Boolean) : [];
  return (
    <p>
      <strong>{label}:</strong> {items.length ? items.join(', ') : 'None'}
    </p>
  );
}

function formatRange(start, end) {
  if (!start && !end) return 'Not set';
  const format = (value) => {
    if (!value) return '...';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  };
  return `${format(start)} → ${format(end)}`;
}
