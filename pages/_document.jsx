import { Html, Head, Main, NextScript } from 'next/document';
import { useTranslation } from '../components/TranslationProvider';

export default function Document() {
  // Note: Next.js does not support hooks in _document, so lang attribute is static.
  // For full i18n SEO, use next.config.js i18n and SSR. This is a simple static example.
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
