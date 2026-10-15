import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { GearGrid } from '@/components/gear/GearGrid';
import { Link } from '@/i18n/navigation';
import { ApiError, api } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  // Non-404 errors propagate to error.tsx.
  const profile = await api.getUser(id).catch((err: unknown) => {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  });
  const me = await getCurrentUser();

  return (
    <main className="page">
      <section className="profile">
        <Avatar name={profile.name} url={profile.avatarUrl} size={96} />
        <div>
          <h1>{profile.name}</h1>
          <p className="summary">
            {profile.ratingCount > 0
              ? `${t('gear.rating', { rating: profile.ratingAvg.toFixed(1) })} · ${t('profile.ratingCount', { count: profile.ratingCount })}`
              : t('gear.noRating')}
          </p>
          {profile.bio && <p>{profile.bio}</p>}
          {me?.id === profile.id && (
            <Link href="/profile/edit" className={buttonClass({ variant: 'outline', size: 'sm' })}>
              {t('profile.edit')}
            </Link>
          )}
        </div>
      </section>
      <h2>{t('profile.listedGear')}</h2>
      {profile.gear.length > 0 ? (
        <GearGrid items={profile.gear} />
      ) : (
        <EmptyState>{t('profile.noGear')}</EmptyState>
      )}
    </main>
  );
}
