import { getTranslations, setRequestLocale } from 'next-intl/server';

// TODO(map): placeholder until the map page is built; it will reuse FilterBar.
export default async function MapPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('map');
  return (
    <main className="page">
      <h1>{t('title')}</h1>
      <p className="state">{t('placeholder')}</p>
    </main>
  );
}
