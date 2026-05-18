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
 * SEO — Comprehensive meta tags for OpenBazar
 *
 * Props:
 *   title           – page-specific title (will be suffixed with | OpenBazar)
 *   description     – meta description (160 chars ideal)
 *   canonical       – canonical URL (relative or absolute)
 *   image           – OG/Twitter image URL
 *   type            – OG type: 'website' | 'product' | 'article'
 *   noindex         – if true, sends noindex,follow
 *   jsonLd          – JSON-LD object or array (structured data)
 *   keywords        – comma-separated keyword string
 *   publishedTime   – ISO date string for articles
 *   modifiedTime    – ISO date string for articles
 *   author          – author name string
 *   locale          – hreflang locale (default: en_BD)
 */
export default function SEO({
  title,
  description,
  canonical,
  image,
  type = 'website',
  noindex = false,
  jsonLd,
  keywords,
  publishedTime,
  modifiedTime,
  author,
  locale = 'en_BD',
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Bangladesh's Trusted Online Marketplace`;
  const canon = canonical ? toAbsoluteUrl(canonical) : SITE_URL;
  const ogImage = toAbsoluteUrl(image || '/api/logo');

  const metaDescription = description
    || 'Buy fresh mangoes, electronics, fashion, beauty & groceries from verified sellers on OpenBazar. Secure bKash/Nagad payments, fast delivery across Bangladesh. Summer mango sale on now!';

  const metaKeywords = keywords
    || 'buy mango online Bangladesh, fresh mango delivery, আম কিনুন অনলাইন, আম ডেলিভারি বাংলাদেশ, summer mango sale, Rajshahi mango buy, Chapai mango online, OpenBazar, online marketplace Bangladesh, e-commerce BD, electronics Bangladesh, fashion BD, grocery delivery Bangladesh';

  // Normalize JSON-LD to always be an array for multi-schema support
  const jsonLdArray = jsonLd
    ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd])
    : null;

  return (
    <Head>
      {/* ── Primary meta ── */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="author" content={author || SITE_NAME} />
      <meta name="copyright" content={`© ${new Date().getFullYear()} ${SITE_NAME}`} />
      <meta name="rating" content="General" />
      <meta name="revisit-after" content="3 days" />

      {/* ── Canonical & robots ── */}
      <link rel="canonical" href={canon} />
      <meta
        name="robots"
        content={noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'}
      />

      {/* ── Hreflang (bilingual: English + Bangla) ── */}
      <link rel="alternate" hrefLang="en-BD" href={canon} />
      <link rel="alternate" hrefLang="bn" href={canon} />
      <link rel="alternate" hrefLang="x-default" href={SITE_URL} />

      {/* ── Open Graph ── */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={locale} />
      <meta property="og:locale:alternate" content="bn_BD" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canon} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${SITE_NAME} — ${title || 'Online Marketplace Bangladesh'}`} />

      {/* Article-specific OG */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* ── Twitter Card ── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@OpenBazarBD" />
      <meta name="twitter:creator" content="@OpenBazarBD" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={`${SITE_NAME} — ${title || 'Online Marketplace Bangladesh'}`} />

      {/* ── JSON-LD Structured Data ── */}
      {jsonLdArray && jsonLdArray.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </Head>
  );
}
