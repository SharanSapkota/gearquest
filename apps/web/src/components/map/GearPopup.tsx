import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { PublicGear } from '@/lib/api';
import { formatMoney } from '@/lib/format';

// Popup card for one gear item. Shows only what the public API returns.
export function GearPopup({ gear }: { gear: PublicGear }) {
  const t = useTranslations();
  const locale = useLocale();
  const { hourlyCents, dailyCents } = gear.pricing;
  const image = gear.images[0];

  return (
    <div className="map-popup">
      {image && (
        // Gear images are arbitrary user-provided URLs, so next/image remote config does not apply.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="map-popup__image" loading="lazy" />
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
        {gear.ownerRatingAvg
          ? t('gear.rating', { rating: gear.ownerRatingAvg.toFixed(1) })
          : t('gear.noRating')}
      </p>
      <Link href={`/gear/${gear.id}`} className="map-popup__link">
        {t('map.viewGear')}
      </Link>
    </div>
  );
}
