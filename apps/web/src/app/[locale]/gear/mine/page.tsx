import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buttonClass } from '@/components/ui/Button';
import { MyGearList } from '@/components/gear/MyGearList';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { requireUser } from '@/lib/auth';

export default async function MyGearPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser(locale, '/gear/mine');
  const t = await getTranslations('myGear');
  // Failures throw to the locale error boundary (error.tsx), which shows the retry state.
  const { items } = await api.getMyGear();
  return (
    <main className="page">
      <div className="page__head">
        <h1>{t('title')}</h1>
        <Link href="/gear/new" className={buttonClass()}>
          {t('add')}
        </Link>
      </div>
      <MyGearList initial={items} />
    </main>
  );
}
