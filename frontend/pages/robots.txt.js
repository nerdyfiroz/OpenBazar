const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://open-bazar.me';

function RobotsPage() {
  // Rendered server-side only
}

export async function getServerSideProps({ res }) {
  const siteUrl = FRONTEND_URL.replace(/\/$/, '');

  const content = `# robots.txt — OpenBazar
User-agent: *
Allow: /

# Block internal/admin paths from crawlers
Disallow: /admin/
Disallow: /api/
Disallow: /user/
Disallow: /checkout
Disallow: /cart
Disallow: /order-success
Disallow: /track/

# Block low-value filter combinations
Disallow: /category?*minPrice=*
Disallow: /category?*maxPrice=*
Disallow: /category?*rating=*
Disallow: /category?*trustedSeller=*

Sitemap: ${siteUrl}/sitemap.xml
`;

  res.setHeader('Content-Type', 'text/plain');
  res.write(content);
  res.end();

  return { props: {} };
}

export default RobotsPage;
