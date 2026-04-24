import '../styles/globals.css';
import { TranslationProvider } from '../components/TranslationProvider';

export default function MyApp({ Component, pageProps }) {
  return (
    <TranslationProvider>
      <Component {...pageProps} />
    </TranslationProvider>
  );
}
