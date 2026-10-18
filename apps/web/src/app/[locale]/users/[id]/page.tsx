import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { ShieldCheckIcon, StarIcon } from '@/components/ui/icons';
import { GearGrid } from '@/components/gear/GearGrid';
import { Link } from '@/i18n/navigation';
import { ApiError, api } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { isOwnerRole } from '@/lib/roles';

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
      <section className="profile contour">
        <Avatar name={profile.name} url={profile.avatarUrl} size={96} />
        <div className="profile__body">
          <h1>{profile.name}</h1>
          <p className="profile__meta">
            {profile.ratingCount > 0 ? (
              <span className="rating">
                <StarIcon size={15} />
                {profile.ratingAvg.toFixed(1)}
                <small>({t('profile.ratingCount', { count: profile.ratingCount })})</small>
              </span>
            ) : (
              <span className="note">{t('gear.noRating')}</span>
            )}
            <span className="badge badge--verified">
              <ShieldCheckIcon size={14} />
              {t('gearDetail.verified')}
            </span>
          </p>
          {profile.bio && <p>{profile.bio}</p>}
          {me?.id === profile.id && (
            <div className="profile__actions">
              <Link href="/profile/edit" className={buttonClass({ variant: 'outline', size: 'sm' })}>
                {t('profile.edit')}
              </Link>
              {isOwnerRole(me.role) ? (
                <Link href="/gear/new" className={buttonClass({ size: 'sm' })}>
                  {t('profile.addGear')}
                </Link>
              ) : (
                <Link href="/become-owner" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                  {t('profile.becomeOwner')}
                </Link>
              )}
            </div>
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
