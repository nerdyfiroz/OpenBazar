import Head from 'next/head';

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'OpenBazar';
const SITE_URL = (process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://open-bazar.me').replace(/\/$/, '');

function toAbsoluteUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${SITE_URL}${path}`;
}

/**
 * SEO
 * - Adds canonical + basic meta + OpenGraph/Twitter
 * - Optional noindex
 * - Optional JSON-LD structured data
 */
export default function SEO({
  title,
  description,
  canonical,
  image,
  type = 'website',
  noindex = false,
  jsonLd,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const canon = canonical ? toAbsoluteUrl(canonical) : SITE_URL;
  const ogImage = toAbsoluteUrl(image || '/api/logo');
  const metaDescription = description || 'Shop products from verified sellers in Bangladesh. Fast delivery and secure payments.';

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />

      <link rel="canonical" href={canon} />

      {noindex && <meta name="robots" content="noindex,follow" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canon} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd ? (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
    </Head>
  );
}
