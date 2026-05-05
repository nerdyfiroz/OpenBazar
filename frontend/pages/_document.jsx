import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#f97316" />

        {/* Geo targeting for Bangladesh */}
        <meta name="geo.region" content="BD" />
        <meta name="geo.placename" content="Bangladesh" />
        <meta name="geo.position" content="23.6850;90.3563" />
        <meta name="ICBM" content="23.6850, 90.3563" />

        {/* Language targeting */}
        <meta httpEquiv="content-language" content="en-BD, bn" />

        {/* Performance hints */}
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />

        {/* Basic PWA-ish hints (optional) */}
        <meta name="application-name" content="OpenBazar" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
