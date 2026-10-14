import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

// TODO(gear-detail): placeholder until the gear detail page is built.
export default async function GearDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('gear');
  return (
    <main className="page">
      <h1>{t('detailTitle')}</h1>
      <p className="state">{t('detailPlaceholder')}</p>
      <Link href="/">{t('back')}</Link>
    </main>
  );
}
