import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#f97316" />

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
