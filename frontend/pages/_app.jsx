import '../styles/globals.css';
import Head from 'next/head';
import { StoreProvider } from '../components/StoreProvider';
import ChatWidget from '../components/ChatWidget';

export default function MyApp({ Component, pageProps }) {
  return (
    <StoreProvider>
      <Head>
        <title>OpenBazar | The Ultimate Online Marketplace</title>
        <meta name="description" content="Shop the latest products, gadgets, fashion, and more at OpenBazar. Fast delivery and secure payments." />
        <meta name="keywords" content="e-commerce, shopping, openbazar, marketplace, online shopping, fashion, electronics" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:title" content="OpenBazar | The Ultimate Online Marketplace" />
        <meta property="og:description" content="Shop the latest products, gadgets, fashion, and more at OpenBazar. Fast delivery and secure payments." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/api/favicon" type="image/svg+xml" sizes="any" />
        <link rel="icon" href="/api/logo" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/api/logo" />
      </Head>
      <Component {...pageProps} />
      <ChatWidget />
    </StoreProvider>
  );
}
