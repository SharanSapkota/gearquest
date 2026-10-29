import { useLocale, useTranslations } from 'next-intl';
import { idSlug, localPath } from '@/lib/seo/paths';
import type { SeoLocale } from '@/lib/seo/routes';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { GearImage } from '@/components/ui/GearImage';
import { PinIcon, StarIcon } from '@/components/ui/icons';
import { Link } from '@/i18n/navigation';
import type { PublicGear } from '@/lib/api';
import { formatMoney } from '@/lib/format';

export function GearCard({ gear, priority = false }: { gear: PublicGear; priority?: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const { hourlyCents, dailyCents } = gear.pricing;

  return (
    <Link href={localPath('gear', locale as SeoLocale, { id: idSlug(gear.id, gear.title) })} className="card">
      <div className="card__media-wrap">
        <GearImage
          src={gear.images[0]}
          hoverSrc={gear.images[1]}
          alt={t('seo.imageAlt', { title: gear.title, category: t(`categories.${gear.category}`), city: gear.city })}
          sizes="(min-width: 1536px) 18vw, (min-width: 1024px) 24vw, (min-width: 640px) 33vw, 50vw"
          className="card__media"
          priority={priority}
          emptyLabel={t('gear.noImage')}
        />
        <span className="card__cat">
          <CategoryIcon category={gear.category} size={14} />
          {t(`categories.${gear.category}`)}
        </span>
      </div>
      <div className="card__body">
        <div className="card__row">
          <h2 className="card__title">{gear.title}</h2>
          {gear.ownerRatingAvg ? (
            <span className="rating" aria-label={t('gear.ratingLabel', { rating: gear.ownerRatingAvg.toFixed(1) })}>
              <StarIcon size={14} />
              {gear.ownerRatingAvg.toFixed(1)}
            </span>
          ) : null}
        </div>
        <p className="card__meta">
          <PinIcon size={14} />
          {gear.city}
        </p>
        <p className="card__price price">
          {hourlyCents !== undefined && (
            <span>{t('gear.perHour', { price: formatMoney(hourlyCents, locale) })}</span>
          )}
          {dailyCents !== undefined && (
            <span>{t('gear.perDay', { price: formatMoney(dailyCents, locale) })}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
