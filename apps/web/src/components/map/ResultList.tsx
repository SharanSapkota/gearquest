import { useLocale, useTranslations } from 'next-intl';
import type { PublicGear } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { GearImage } from '@/components/ui/GearImage';

// Tapping an item focuses its marker on the map; the gear page is reached from the marker card.
export function ResultList({
  items,
  selectedId,
  onFocus,
}: {
  items: PublicGear[];
  selectedId: string | null;
  onFocus: (id: string) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  if (items.length === 0) return <p className="results-empty">{t('map.empty')}</p>;
  return (
    <ul className="results">
      {items.map((gear) => {
        const { hourlyCents, dailyCents } = gear.pricing;
        const price =
          dailyCents !== undefined
            ? t('gear.perDay', { price: formatMoney(dailyCents, locale) })
            : hourlyCents !== undefined
              ? t('gear.perHour', { price: formatMoney(hourlyCents, locale) })
              : '';
        return (
          <li key={gear.id}>
            <button
              type="button"
              className="result"
              aria-current={gear.id === selectedId}
              onClick={() => onFocus(gear.id)}
            >
              <GearImage
                src={gear.images[0]}
                alt=""
                sizes="84px"
                ratio="1 / 1"
                className="result__thumb"
              />
              <span className="result__body">
                <span className="result__title">{gear.title}</span>
                <p>
                  {t(`categories.${gear.category}`)} · {gear.city}
                </p>
                <p className="result__price">{price}</p>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
