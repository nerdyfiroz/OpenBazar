import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import MarketplaceLayout from '../components/MarketplaceLayout';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

function buildParams(query) {
  const params = new URLSearchParams();
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) params.set(key, value);
  });
  return params;
}

function toStringOrEmpty(v) {
  return typeof v === 'string' ? v : (v == null ? '' : String(v));
}

function getSiteUrl() {
  const base = process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://open-bazar.me';
  return base.replace(/\/$/, '');
}

export default function Category({ initialProducts = [], initialLoading = true, initialQuery = null }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(initialLoading);

  const query = useMemo(() => {
    // When SSR provides initialQuery, prefer it on first render to avoid hydration mismatch.
    const source = (router.isReady ? router.query : initialQuery) || {};
    return {
      category: toStringOrEmpty(source.category),
      brand: toStringOrEmpty(source.brand),
      minPrice: toStringOrEmpty(source.minPrice),
      maxPrice: toStringOrEmpty(source.maxPrice),
      rating: toStringOrEmpty(source.rating),
      saleType: toStringOrEmpty(source.saleType),
      trustedSeller: toStringOrEmpty(source.trustedSeller),
      sort: toStringOrEmpty(source.sort) || 'newest',
      q: toStringOrEmpty(source.q)
    };
  }, [router.isReady, router.query, initialQuery]);

  useEffect(() => {
    const params = buildParams(query);

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

  const siteUrl = getSiteUrl();
  const canonicalBase = `${siteUrl}/category`;

  // SEO: index only clean pages (category-only or q-only). noindex filtered combos.
  const hasAnyFilter = Boolean(query.brand || query.minPrice || query.maxPrice || query.rating || query.saleType || query.trustedSeller);
  const noindex = hasAnyFilter;

  const pageLabel = query.q
    ? `Search: ${query.q}`
    : (query.category ? query.category : 'All Products');

  const seoTitle = pageLabel;
  const seoDescription = query.q
    ? `Search results for "${query.q}" on OpenBazar. Browse verified sellers and fast delivery across Bangladesh.`
    : query.category
      ? `Buy ${query.category} products from verified sellers on OpenBazar. Secure payments and fast delivery.`
      : 'Browse all products on OpenBazar. Shop from verified sellers with secure payments and fast delivery.';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Category',
        item: canonicalBase
      },
      ...(query.category ? [{
        '@type': 'ListItem',
        position: 3,
        name: query.category,
        item: `${canonicalBase}?category=${encodeURIComponent(query.category)}`
      }] : []),
      ...(query.q ? [{
        '@type': 'ListItem',
        position: query.category ? 4 : 3,
        name: `Search: ${query.q}`,
        item: `${canonicalBase}?q=${encodeURIComponent(query.q)}`
      }] : [])
    ]
  };

  return (
    <MarketplaceLayout>
      <SEO
        title={seoTitle}
        description={seoDescription}
        canonical={canonicalBase}
        noindex={noindex}
        jsonLd={jsonLd}
      />
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 md:grid-cols-[280px_1fr] md:px-6">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="mb-4 text-lg font-bold">Filters</h2>

          <FilterField label="Category">
            <select value={query.category} onChange={(e) => updateFilter('category', e.target.value)} className="input">
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Fashion">Fashion</option>
              <option value="Beauty">Beauty</option>
              <option value="Home & Living">Home & Living</option>
              <option value="Sports">Sports</option>
              <option value="Toys">Toys</option>
              <option value="Grocery">Grocery</option>
              <option value="Food">Food</option>
              <option value="Mango">Mango</option>
            </select>
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

          <FilterField label="Sale Type">
            <select value={query.saleType} onChange={(e) => updateFilter('saleType', e.target.value)} className="input">
              <option value="">All</option>
              <option value="sale">Flash Sale & Discounts</option>
              <option value="preorder">Pre-order</option>
              <option value="sale,preorder">Sale & Pre-order</option>
              <option value="regular">Regular</option>
            </select>
          </FilterField>

          <FilterField label="Seller Type">
            <select value={query.trustedSeller} onChange={(e) => updateFilter('trustedSeller', e.target.value)} className="input">
              <option value="">All Sellers</option>
              <option value="true">Trusted Sellers (Golden Badge)</option>
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
              <option value="top_rating">Top Rating</option>
              <option value="top_sale">Top Sale</option>
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

export async function getServerSideProps(ctx) {
  const query = ctx.query || {};
  const params = buildParams({
    category: toStringOrEmpty(query.category),
    brand: toStringOrEmpty(query.brand),
    minPrice: toStringOrEmpty(query.minPrice),
    maxPrice: toStringOrEmpty(query.maxPrice),
    rating: toStringOrEmpty(query.rating),
    saleType: toStringOrEmpty(query.saleType),
    trustedSeller: toStringOrEmpty(query.trustedSeller),
    sort: toStringOrEmpty(query.sort) || 'newest',
    q: toStringOrEmpty(query.q),
  });

  let initialProducts = [];
  let initialLoading = true;
  try {
    const res = await fetch(`${API_BASE}/products?${params.toString()}`);
    const data = await res.json();
    initialProducts = Array.isArray(data?.products) ? data.products : (Array.isArray(data) ? data : []);
    initialLoading = false;
  } catch {
    initialProducts = [];
    initialLoading = false;
  }

  return {
    props: {
      initialProducts,
      initialLoading,
      initialQuery: {
        category: toStringOrEmpty(query.category),
        brand: toStringOrEmpty(query.brand),
        minPrice: toStringOrEmpty(query.minPrice),
        maxPrice: toStringOrEmpty(query.maxPrice),
        rating: toStringOrEmpty(query.rating),
        saleType: toStringOrEmpty(query.saleType),
        trustedSeller: toStringOrEmpty(query.trustedSeller),
        sort: toStringOrEmpty(query.sort) || 'newest',
        q: toStringOrEmpty(query.q),
      }
    }
  };
}

function FilterField({ label, children }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}
