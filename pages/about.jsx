import Nav from '../components/Nav';
import { useTranslation } from '../components/TranslationProvider';

export default function About() {
  const { t } = useTranslation();
  return (
    <>
      <Nav />
      <main style={{ padding: 32 }}>
        <h1>{t('nav.about')}</h1>
        <p>This is the about page. (Add your content here.)</p>
      </main>
    </>
  );
}
