import { Html, Head, Main, NextScript } from 'next/document';

const SITE_URL = (process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://open-bazar.me').replace(/\/$/, '');

export default function Document() {
  return (
    <Html lang="en-BD" dir="ltr">
      <Head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        {/* ── Theme color (browser tab / mobile toolbar) ── */}
        <meta name="theme-color" content="#f97316" />
        <meta name="msapplication-TileColor" content="#f97316" />

        {/* ── Geo targeting for Bangladesh ── */}
        <meta name="geo.region" content="BD" />
        <meta name="geo.placename" content="Dhaka, Bangladesh" />
        <meta name="geo.position" content="23.6850;90.3563" />
        <meta name="ICBM" content="23.6850, 90.3563" />

        {/* ── Language targeting ── */}
        <meta httpEquiv="content-language" content="en-BD, bn-BD" />

        {/* ── PWA manifest & icons ── */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/api/favicon" type="image/svg+xml" sizes="any" />
        <link rel="icon" href="/api/logo" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/api/logo" />

        {/* ── Performance: preconnect to common origins ── */}
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        {/* ── Global Organization JSON-LD (present on every page) ── */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'OpenBazar',
              alternateName: 'OpenBazar Bangladesh',
              url: SITE_URL,
              logo: `${SITE_URL}/api/logo`,
              sameAs: [
                'https://www.facebook.com/OpenBazarBD',
                'https://twitter.com/OpenBazarBD',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'Customer Support',
                email: 'support@open-bazar.me',
                availableLanguage: ['English', 'Bengali'],
                areaServed: 'BD',
              },
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Dhaka',
                addressCountry: 'BD',
              },
            }),
          }}
        />

        {/* ── Global WebSite JSON-LD with Sitelinks Searchbox ── */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'OpenBazar',
              url: SITE_URL,
              inLanguage: ['en-BD', 'bn'],
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${SITE_URL}/category?q={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
