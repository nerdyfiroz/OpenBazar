import Nav from '../components/Nav';
import { useTranslation } from '../components/TranslationProvider';

export default function Contact() {
  const { t } = useTranslation();
  return (
    <>
      <Nav />
      <main style={{ padding: 32 }}>
        <h1>{t('nav.contact')}</h1>
        <p>Contact us at: info@openbazar.com</p>
      </main>
    </>
  );
}
