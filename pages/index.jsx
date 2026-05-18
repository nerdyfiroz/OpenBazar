import Nav from '../components/Nav';
import Hero from '../components/Hero';
import ExampleForm from '../components/ExampleForm';
import { useTranslation } from '../components/TranslationProvider';

export default function Home() {
  const { t } = useTranslation();
  return (
    <>
      <Nav />
      <Hero />
      <div style={{ textAlign: 'center', margin: 32 }}>
        <button>{t('buttons.buy')}</button>
        <button>{t('buttons.sell')}</button>
      </div>
      <ExampleForm />
    </>
  );
}
