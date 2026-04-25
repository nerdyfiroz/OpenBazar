import '../styles/globals.css';
import Head from 'next/head';
import { StoreProvider } from '../components/StoreProvider';
import ChatWidget from '../components/ChatWidget';

export default function MyApp({ Component, pageProps }) {
  return (
    <StoreProvider>
      <Head>
        <link rel="icon" href="/api/logo" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/api/logo" />
      </Head>
      <Component {...pageProps} />
      <ChatWidget />
    </StoreProvider>
  );
}
