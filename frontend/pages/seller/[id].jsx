import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import MarketplaceLayout from '../../components/MarketplaceLayout';
import ProductCard from '../../components/ProductCard';
import { resolveImageSrc, FALLBACK_IMAGE } from '../../utils/resolveImageSrc';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

export default function SellerProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`${API_BASE}/auth/seller/${id}`).then((r) => r.json()).catch(() => null),
      fetch(`${API_BASE}/products?seller=${id}&limit=24`).then((r) => r.json()).catch(() => ({ products: [] }))
    ]).then(([sellerData, productData]) => {
      setSeller(sellerData);
      setProducts(Array.isArray(productData?.products) ? productData.products : []);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-7xl p-10 text-center text-slate-400 animate-pulse">Loading seller profile...</main>
    </MarketplaceLayout>
  );

  if (!seller || seller.message) return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-7xl p-10 text-center">
        <p className="text-4xl">🏪</p>
        <p className="mt-3 text-slate-500">Seller not found.</p>
        <Link href="/category" className="mt-4 inline-block rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white">Browse Products</Link>
      </main>
    </MarketplaceLayout>
  );

  const totalRating = products.reduce((s, p) => s + Number(p.rating || 0), 0);
  const avgRating = products.length ? (totalRating / products.length).toFixed(1) : '—';
  const totalSold = products.reduce((s, p) => s + Number(p.soldCount || 0), 0);

  return (
    <MarketplaceLayout>
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-6">
        {/* ── Seller Header ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-3xl font-black text-white shadow-lg">
              {(seller.name || 'S')[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black">{seller.name}</h1>
                {seller.isSellerVerifiedBadge && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">✓ Verified</span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">Seller on OpenBazar</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <div className="text-center">
                  <p className="text-lg font-black text-orange-500">{products.length}</p>
                  <p className="text-xs text-slate-500">Products</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-orange-500">{totalSold}</p>
                  <p className="text-xs text-slate-500">Units Sold</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-orange-500">⭐ {avgRating}</p>
                  <p className="text-xs text-slate-500">Avg Rating</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Products ── */}
        <div>
          <h2 className="mb-4 text-xl font-bold">Products by {seller.name} ({products.length})</h2>
          {!products.length ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-slate-400">
              <p className="text-3xl">📦</p>
              <p className="mt-2">No approved products yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}
        </div>
      </main>
    </MarketplaceLayout>
  );
}
