import { useTranslations } from 'next-intl';
import { CATEGORIES } from '@gearquest/shared';
import { categoryPinSvg } from './categoryIcons';

// Also carries the intermediary disclaimer: the map page has no footer.
export function Legend() {
  const t = useTranslations();
  return (
    <details className="map-legend">
      <summary>{t('map.legend')}</summary>
      <ul>
        {CATEGORIES.map((category) => (
          <li key={category}>
            {/* Static, trusted SVG from categoryIcons.ts (same markup as the map markers). */}
            <span dangerouslySetInnerHTML={{ __html: categoryPinSvg(category, 20) }} />
            {t(`categories.${category}`)}
          </li>
        ))}
      </ul>
      <p className="note">{t('legal.disclaimer')}</p>
    </details>
  );
}
