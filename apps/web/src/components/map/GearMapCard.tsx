import { useLocale, useTranslations } from 'next-intl';
import { buttonClass, IconButton } from '@/components/ui/Button';
import { GearImage } from '@/components/ui/GearImage';
import { CloseIcon, StarIcon } from '@/components/ui/icons';
import { Link } from '@/i18n/navigation';
import type { PublicGear } from '@/lib/api';
import { formatMoney } from '@/lib/format';

// Compact card pinned to the bottom of the map on phones when a marker is tapped.
export function GearMapCard({ gear, onClose }: { gear: PublicGear; onClose: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const { hourlyCents, dailyCents } = gear.pricing;
  return (
    <aside className="map-card" aria-label={gear.title}>
      <GearImage
        src={gear.images[0]}
        alt=""
        sizes="96px"
        ratio="1 / 1"
        className="map-card__thumb"
        emptyLabel={t('gear.noImage')}
      />
      <div className="map-card__body">
        <h3>{gear.title}</h3>
        <p>
          {t(`categories.${gear.category}`)} · {gear.city}
        </p>
        <p>
          <strong>
            {dailyCents !== undefined
              ? t('gear.perDay', { price: formatMoney(dailyCents, locale) })
              : hourlyCents !== undefined
                ? t('gear.perHour', { price: formatMoney(hourlyCents, locale) })
                : ''}
          </strong>{' '}
          ·{' '}
          {gear.ownerRatingAvg ? (
            <span className="rating">
              <StarIcon size={13} />
              {gear.ownerRatingAvg.toFixed(1)}
            </span>
          ) : (
            t('gear.noRating')
          )}
        </p>
        <Link href={`/gear/${gear.id}`} className={buttonClass({ size: 'sm' })}>
          {t('map.viewGear')}
        </Link>
      </div>
      <IconButton label={t('map.closeCard')} variant="ghost" className="map-card__close" onClick={onClose}>
        <CloseIcon />
      </IconButton>
    </aside>
  );
}
