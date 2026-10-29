import { useLocale, useTranslations } from 'next-intl';
import { idSlug, localPath } from '@/lib/seo/paths';
import type { SeoLocale } from '@/lib/seo/routes';
import { Avatar } from '@/components/ui/Avatar';
import { ShieldCheckIcon, StarIcon } from '@/components/ui/icons';
import { Link } from '@/i18n/navigation';
import type { GearDetail } from '@/lib/api';

// Public owner info only: never phone or email. `ratingCount` comes from the public profile.
export function OwnerCard({
  owner,
  ratingCount,
}: {
  owner: NonNullable<GearDetail['owner']>;
  ratingCount?: number;
}) {
  const t = useTranslations();
  const locale = useLocale() as SeoLocale;
  return (
    <section className="owner-card" aria-label={t('gearDetail.owner')}>
      <Avatar name={owner.name} url={owner.avatarUrl} size={56} />
      <div className="owner-card__body">
        <p className="owner-card__label">{t('gearDetail.hostedBy')}</p>
        <Link href={localPath('user', locale, { id: idSlug(owner.id, owner.name) })} className="owner-card__name">
          {owner.name}
        </Link>
        <p className="owner-card__meta">
          {owner.rating ? (
            <span className="rating">
              <StarIcon size={14} />
              {owner.rating.toFixed(1)}
              {ratingCount !== undefined && ratingCount > 0 && (
                <small>({t('gearDetail.ratingCount', { count: ratingCount })})</small>
              )}
            </span>
          ) : (
            <span className="note">{t('gear.noRating')}</span>
          )}
          <span className="badge badge--verified">
            <ShieldCheckIcon size={14} />
            {t('gearDetail.verified')}
          </span>
        </p>
      </div>
    </section>
  );
}
