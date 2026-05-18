const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';
const FRONTEND_URL = (process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://open-bazar.me').replace(/\/$/, '');

const TODAY = new Date().toISOString().split('T')[0];

const CATEGORIES = [
  'Mango',
  'Electronics',
  'Fashion',
  'Beauty',
  'Home & Living',
  'Sports',
  'Toys',
  'Grocery',
  'Food',
];

// Static pages with their expected change frequencies and priorities
const STATIC_PAGES = [
  { path: '/',              changefreq: 'daily',   priority: '1.0', lastmod: TODAY },
  { path: '/category',     changefreq: 'daily',   priority: '0.9', lastmod: TODAY },
  { path: '/become-seller',changefreq: 'weekly',  priority: '0.7', lastmod: TODAY },
  { path: '/about',        changefreq: 'monthly', priority: '0.5' },
  { path: '/contact',      changefreq: 'monthly', priority: '0.5' },
  { path: '/terms',        changefreq: 'monthly', priority: '0.4' },
  { path: '/privacy-policy', changefreq: 'monthly', priority: '0.4' },
];

function urlTag({ loc, lastmod, changefreq, priority }) {
  return `
  <url>
    <loc>${loc}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function generateSiteMap(products, sellers) {
  const staticUrls = STATIC_PAGES
    .map((p) => urlTag({
      loc: `${FRONTEND_URL}${p.path}`,
      lastmod: p.lastmod,
      changefreq: p.changefreq,
      priority: p.priority,
    }))
    .join('');

  // Mango first (highest value), then the rest
  const categoryUrls = CATEGORIES.map((cat) => urlTag({
    loc: `${FRONTEND_URL}/category?category=${encodeURIComponent(cat)}`,
    lastmod: TODAY,
    changefreq: 'daily',
    priority: cat === 'Mango' ? '0.95' : '0.75',
  })).join('');

  const productUrls = products
    .map(({ _id, updatedAt }) => urlTag({
      loc: `${FRONTEND_URL}/product/${_id}`,
      lastmod: updatedAt ? new Date(updatedAt).toISOString().split('T')[0] : TODAY,
      changefreq: 'weekly',
      priority: '0.85',
    }))
    .join('');

  const sellerUrls = sellers
    .map(({ _id, updatedAt }) => urlTag({
      loc: `${FRONTEND_URL}/seller/${_id}`,
      lastmod: updatedAt ? new Date(updatedAt).toISOString().split('T')[0] : TODAY,
      changefreq: 'weekly',
      priority: '0.65',
    }))
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
    http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${staticUrls}
${categoryUrls}
${productUrls}
${sellerUrls}
</urlset>`;
}

function SiteMap() {
  // getServerSideProps handles the response
}

export async function getServerSideProps({ res }) {
  const fetchJson = async (url, fallback = []) => {
    try {
      const r = await fetch(url);
      if (!r.ok) return fallback;
      return await r.json();
    } catch {
      return fallback;
    }
  };

  // Fetch products (up to 5000 to ensure full coverage)
  const [productsData, sellersData] = await Promise.all([
    fetchJson(`${API_BASE}/products?limit=5000&approved=true`),
    fetchJson(`${API_BASE}/auth/sellers/public`, []),
  ]);

  const products = Array.isArray(productsData?.products)
    ? productsData.products
    : (Array.isArray(productsData) ? productsData : []);

  // sellers endpoint may not exist yet – graceful fallback to []
  const sellers = Array.isArray(sellersData) ? sellersData : [];

  const sitemap = generateSiteMap(products, sellers);

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(sitemap);
  res.end();

  return { props: {} };
}

export default SiteMap;
