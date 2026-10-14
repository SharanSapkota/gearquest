import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { PublicGear } from '@/lib/api';
import { formatMoney } from '@/lib/format';

export function GearCard({ gear }: { gear: PublicGear }) {
  const t = useTranslations();
  const locale = useLocale();
  const { hourlyCents, dailyCents } = gear.pricing;
  const image = gear.images[0];

  return (
    <Link href={`/gear/${gear.id}`} className="card">
      {image ? (
        // Gear images are arbitrary user-provided URLs, so next/image remote config does not apply.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={gear.title} className="card__image" loading="lazy" />
      ) : (
        <div className="card__image card__image--empty">{t('gear.noImage')}</div>
      )}
      <div className="card__body">
        <h2 className="card__title">{gear.title}</h2>
        <p className="card__meta">
          {t(`categories.${gear.category}`)} · {gear.city}
        </p>
        <p className="card__price">
          {hourlyCents !== undefined && (
            <span>{t('gear.perHour', { price: formatMoney(hourlyCents, locale) })}</span>
          )}
          {dailyCents !== undefined && (
            <span>{t('gear.perDay', { price: formatMoney(dailyCents, locale) })}</span>
          )}
        </p>
        <p className="card__rating">
          {gear.ownerRatingAvg
            ? t('gear.rating', { rating: gear.ownerRatingAvg.toFixed(1) })
            : t('gear.noRating')}
        </p>
      </div>
    </Link>
  );
}
