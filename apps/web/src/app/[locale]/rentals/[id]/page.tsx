import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { RentalCard } from '@/components/rentals/RentalCard';
import { Link, redirect } from '@/i18n/navigation';
import { ApiError, api } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { getNow } from '@/lib/format';

export default async function RentalDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: '/', locale });
  const t = await getTranslations('rentals');
  // The API answers 404 for non-parties, so a rental's existence is never leaked.
  const rental = await api.getRental(id).catch((err: unknown) => {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  });
  return (
    <main className="page">
      <h1>{t('detailTitle')}</h1>
      <RentalCard rental={rental} nowMs={getNow()} detail />
      <Link href="/rentals">{t('back')}</Link>
    </main>
  );
}
