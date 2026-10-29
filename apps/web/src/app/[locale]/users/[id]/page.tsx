import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound, permanentRedirect } from 'next/navigation';
import { buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { ShieldCheckIcon, StarIcon } from '@/components/ui/icons';
import { GearGrid } from '@/components/gear/GearGrid';
import { Link } from '@/i18n/navigation';
import { ApiError } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { getUserCached } from '@/lib/metadata';
import { buildMetadata, fitDescription } from '@/lib/seo/metadata';
import { idSlug, parseIdSlug, publicPath } from '@/lib/seo/paths';
import { isSeoLocale, type SeoLocale } from '@/lib/seo/routes';
import { isOwnerRole } from '@/lib/roles';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale: rawLocale, id: param } = await params;
  if (!isSeoLocale(rawLocale)) return {};
  const locale = rawLocale;
  const profile = await getUserCached(parseIdSlug(param).id).catch(() => null);
  const t = await getTranslations({ locale });
  if (!profile) return { title: t('meta.profileFallback'), robots: { index: false, follow: false } };
  return buildMetadata({
    locale,
    page: 'user',
    params: { id: idSlug(profile.id, profile.name) },
    title: profile.name,
    description: fitDescription([t('seo.userIntro', { name: profile.name }), profile.bio]),
    type: 'profile',
  });
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: param } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const { id, hasSlugForm } = parseIdSlug(param);
  // Non-404 errors propagate to error.tsx.
  const profile = await getUserCached(id).catch((err: unknown) => {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  });
  const canonical = idSlug(profile.id, profile.name);
  if (hasSlugForm && param !== canonical) {
    permanentRedirect(publicPath('user', locale as SeoLocale, { id: canonical }));
  }
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
