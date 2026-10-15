import { getTranslations, setRequestLocale } from 'next-intl/server';
import { MyGearList } from '@/components/gear/MyGearList';
import { Link, redirect } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

export default async function MyGearPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: '/', locale });
  const t = await getTranslations('myGear');
  // Failures throw to the locale error boundary (error.tsx), which shows the retry state.
  const { items } = await api.getMyGear();
  return (
    <main className="page">
      <div className="page__head">
        <h1>{t('title')}</h1>
        <Link href="/gear/new" className="button">
          {t('add')}
        </Link>
      </div>
      <MyGearList initial={items} />
    </main>
  );
}
