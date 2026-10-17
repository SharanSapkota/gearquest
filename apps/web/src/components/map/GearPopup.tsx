import { useLocale, useTranslations } from 'next-intl';
import { GearImage } from '@/components/ui/GearImage';
import { buttonClass } from '@/components/ui/Button';
import { StarIcon } from '@/components/ui/icons';
import { Link } from '@/i18n/navigation';
import type { PublicGear } from '@/lib/api';
import { formatMoney } from '@/lib/format';

// Gear summary for the desktop info window. Shows only what the public API returns.
export function GearPopup({ gear }: { gear: PublicGear }) {
  const t = useTranslations();
  const locale = useLocale();
  const { hourlyCents, dailyCents } = gear.pricing;

  return (
    <div className="map-popup">
      {gear.images[0] && (
        <GearImage src={gear.images[0]} alt="" sizes="230px" className="map-popup__image" />
      )}
      <h3 className="map-popup__title">{gear.title}</h3>
      <p className="map-popup__meta">{t(`categories.${gear.category}`)}</p>
      <p className="map-popup__price">
        {hourlyCents !== undefined && (
          <span>{t('gear.perHour', { price: formatMoney(hourlyCents, locale) })}</span>
        )}
        {dailyCents !== undefined && (
          <span>{t('gear.perDay', { price: formatMoney(dailyCents, locale) })}</span>
        )}
      </p>
      <p className="map-popup__meta">
        {gear.ownerRatingAvg ? (
          <span className="rating">
            <StarIcon size={13} />
            {gear.ownerRatingAvg.toFixed(1)}
          </span>
        ) : (
          t('gear.noRating')
        )}
      </p>
      <Link
        href={`/gear/${gear.id}`}
        className={`${buttonClass({ size: 'sm' })} map-popup__link`}
      >
        {t('map.viewGear')}
      </Link>
    </div>
  );
}
