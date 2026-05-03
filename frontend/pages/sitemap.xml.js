const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://open-bazar.me';

const CATEGORIES = [
  'Electronics',
  'Fashion',
  'Beauty',
  'Home & Living',
  'Sports',
  'Toys',
  'Grocery',
  'Food',
  'Mango'
];

function generateSiteMap(products) {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>${FRONTEND_URL}</loc>
       <changefreq>daily</changefreq>
       <priority>1.0</priority>
     </url>
     <url>
       <loc>${FRONTEND_URL}/category</loc>
       <changefreq>daily</changefreq>
       <priority>0.8</priority>
     </url>
     <url>
       <loc>${FRONTEND_URL}/about</loc>
       <changefreq>monthly</changefreq>
       <priority>0.5</priority>
     </url>
     <url>
       <loc>${FRONTEND_URL}/contact</loc>
       <changefreq>monthly</changefreq>
       <priority>0.5</priority>
     </url>
     <url>
       <loc>${FRONTEND_URL}/terms</loc>
       <changefreq>monthly</changefreq>
       <priority>0.5</priority>
     </url>
     <url>
       <loc>${FRONTEND_URL}/privacy-policy</loc>
       <changefreq>monthly</changefreq>
       <priority>0.5</priority>
     </url>
     ${CATEGORIES.map((c) => `
     <url>
       <loc>${FRONTEND_URL}/category?category=${encodeURIComponent(c)}</loc>
       <changefreq>daily</changefreq>
       <priority>0.7</priority>
     </url>
     `).join('')}
     ${products
       .map(({ _id, updatedAt }) => {
         return `
       <url>
           <loc>${FRONTEND_URL}/product/${_id}</loc>
           <lastmod>${new Date(updatedAt || Date.now()).toISOString()}</lastmod>
           <changefreq>weekly</changefreq>
           <priority>0.9</priority>
       </url>
     `;
       })
       .join('')}
   </urlset>
 `;
}

function SiteMap() {
  // getServerSideProps will do the heavy lifting
}

export async function getServerSideProps({ res }) {
  let products = [];
  try {
    // If you have >1000 products, consider extending this to paginate.
    const request = await fetch(`${API_BASE}/products?limit=2000`);
    const data = await request.json();
    products = Array.isArray(data.products) ? data.products : (Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Failed to fetch products for sitemap', error);
  }

  // Generate the XML sitemap with the products data
  const sitemap = generateSiteMap(products);

  res.setHeader('Content-Type', 'text/xml');
  // Send the XML to the browser
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
}

export default SiteMap;
