import { useLocale, useTranslations } from 'next-intl';
import { GearImage } from '@/components/ui/GearImage';
import { Link } from '@/i18n/navigation';
import type { PublicGear } from '@/lib/api';
import { formatMoney } from '@/lib/format';

export function GearCard({ gear, priority = false }: { gear: PublicGear; priority?: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const { hourlyCents, dailyCents } = gear.pricing;

  return (
    <Link href={`/gear/${gear.id}`} className="card">
      <div className="card__media-wrap">
        <GearImage
          src={gear.images[0]}
          alt={gear.title}
          sizes="(min-width: 1200px) 280px, (min-width: 640px) 33vw, 100vw"
          className="card__media"
          priority={priority}
          emptyLabel={t('gear.noImage')}
        />
        <div className="card__chips">
          <span className="badge">{t(`categories.${gear.category}`)}</span>
        </div>
        <div className="card__pill">
          {hourlyCents !== undefined && (
            <span className="pill">{t('gear.perHour', { price: formatMoney(hourlyCents, locale) })}</span>
          )}
          {dailyCents !== undefined && (
            <span className="pill">{t('gear.perDay', { price: formatMoney(dailyCents, locale) })}</span>
          )}
        </div>
      </div>
      <div className="card__body">
        <h2 className="card__title">{gear.title}</h2>
        <p className="card__meta">{gear.city}</p>
        <p className="card__rating">
          {gear.ownerRatingAvg
            ? t('gear.rating', { rating: gear.ownerRatingAvg.toFixed(1) })
            : t('gear.noRating')}
        </p>
      </div>
    </Link>
  );
}
