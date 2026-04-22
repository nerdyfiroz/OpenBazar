import '../styles/globals.css';
import { StoreProvider } from '../components/StoreProvider';
import ChatWidget from '../components/ChatWidget';

export default function MyApp({ Component, pageProps }) {
  return (
    <StoreProvider>
      <Component {...pageProps} />
      <ChatWidget />
    </StoreProvider>
  );
}
