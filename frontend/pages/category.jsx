import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import MarketplaceLayout from '../components/MarketplaceLayout';
import ProductCard from '../components/ProductCard';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

export default function Category() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => ({
    category: router.query.category || '',
    brand: router.query.brand || '',
    minPrice: router.query.minPrice || '',
    maxPrice: router.query.maxPrice || '',
    rating: router.query.rating || '',
    sort: router.query.sort || 'newest',
    q: router.query.q || ''
  }), [router.query]);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && value !== null) params.set(key, value);
    });

    setLoading(true);
    fetch(`${API_BASE}/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(Array.isArray(data.products) ? data.products : (Array.isArray(data) ? data : []));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [query]);

  const updateFilter = (field, value) => {
    const next = { ...router.query, [field]: value };
    if (!value) delete next[field];
    router.push({ pathname: '/category', query: next });
  };

  return (
    <MarketplaceLayout>
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 md:grid-cols-[280px_1fr] md:px-6">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="mb-4 text-lg font-bold">Filters</h2>

          <FilterField label="Category">
            <input value={query.category} onChange={(e) => updateFilter('category', e.target.value)} className="input" placeholder="e.g. Electronics" />
          </FilterField>

          <FilterField label="Brand">
            <input value={query.brand} onChange={(e) => updateFilter('brand', e.target.value)} className="input" placeholder="e.g. Samsung" />
          </FilterField>

          <FilterField label="Price Range">
            <div className="grid grid-cols-2 gap-2">
              <input value={query.minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} className="input" placeholder="Min" type="number" />
              <input value={query.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} className="input" placeholder="Max" type="number" />
            </div>
          </FilterField>

          <FilterField label="Minimum Rating">
            <select value={query.rating} onChange={(e) => updateFilter('rating', e.target.value)} className="input">
              <option value="">Any</option>
              <option value="4">4★ & above</option>
              <option value="3">3★ & above</option>
              <option value="2">2★ & above</option>
            </select>
          </FilterField>
        </aside>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-600">Showing {products.length} products</p>
            <select value={query.sort} onChange={(e) => updateFilter('sort', e.target.value)} className="input w-[220px]">
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="popular">Popularity</option>
            </select>
          </div>

          {loading ? (
            <p>Loading products...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => <ProductCard key={product._id} product={product} />)}
            </div>
          )}
        </section>
      </div>
    </MarketplaceLayout>
  );
}

function FilterField({ label, children }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}
