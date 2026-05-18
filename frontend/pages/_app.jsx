import '../styles/globals.css';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { StoreProvider } from '../components/StoreProvider';

const ChatWidget = dynamic(() => import('../components/ChatWidget'), { ssr: false });

export default function MyApp({ Component, pageProps }) {
  const [showChat, setShowChat] = useState(false);

  // Defer loading chat widget so it doesn't compete with critical page JS.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const win = window;
    const ric = win.requestIdleCallback;
    if (typeof ric === 'function') {
      const id = ric(() => setShowChat(true), { timeout: 2000 });
      return () => win.cancelIdleCallback?.(id);
    }

    const t = setTimeout(() => setShowChat(true), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <StoreProvider>
      <Head>
        <meta name="keywords" content="buy mango online Bangladesh, fresh mango delivery, summer mango sale, আম কিনুন অনলাইন, আম ডেলিভারি, Rajshahi mango, Chapai mango, OpenBazar, e-commerce Bangladesh, online marketplace BD, electronics, fashion, beauty, grocery" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/api/favicon" type="image/svg+xml" sizes="any" />
        <link rel="icon" href="/api/logo" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/api/logo" />
      </Head>
      <Component {...pageProps} />
      {showChat && <ChatWidget />}
    </StoreProvider>
  );
}
