import Nav from '../components/Nav';
import { useTranslation } from '../components/TranslationProvider';

export default function Policies() {
  const { t } = useTranslation();
  return (
    <>
      <Nav />
      <main style={{ padding: 32 }}>
        <h1>{t('policies.privacy')}</h1>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
        <h2>{t('policies.terms')}</h2>
        <p>Aliquam erat volutpat. Etiam euismod, urna eu tincidunt.</p>
      </main>
    </>
  );
}
