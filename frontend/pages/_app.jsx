import '../styles/globals.css';
import Head from 'next/head';
import { StoreProvider } from '../components/StoreProvider';
import ChatWidget from '../components/ChatWidget';

export default function MyApp({ Component, pageProps }) {
  return (
    <StoreProvider>
      <Head>
        <title>{'\u00A0'}</title>
        <link rel="icon" href="/api/favicon" type="image/svg+xml" sizes="any" />
        <link rel="icon" href="/api/logo" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/api/logo" />
      </Head>
      <Component {...pageProps} />
      <ChatWidget />
    </StoreProvider>
  );
}
