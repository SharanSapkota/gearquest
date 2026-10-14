import { useTranslations } from 'next-intl';

export default function Loading() {
  const t = useTranslations('home');
  return (
    <main className="page" aria-busy="true">
      <h1>{t('title')}</h1>
      <p className="summary">{t('loading')}</p>
      <ul className="grid">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i} className="card card--skeleton" />
        ))}
      </ul>
    </main>
  );
}
