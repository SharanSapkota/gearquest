import { useTranslations } from 'next-intl';
import { CATEGORIES } from '@gearshare/shared';
import { CATEGORY_STYLE } from './categoryIcons';

export function Legend() {
  const t = useTranslations();
  return (
    <details className="map-legend">
      <summary>{t('map.legend')}</summary>
      <ul>
        {CATEGORIES.map((category) => {
          const { color, glyph } = CATEGORY_STYLE[category];
          return (
            <li key={category}>
              <svg width="20" height="25" viewBox="0 0 32 40" aria-hidden="true" focusable="false">
                <path
                  d="M16 1C7.7 1 1 7.6 1 15.8c0 10.6 13.4 22 14.2 22.7a1.2 1.2 0 0 0 1.6 0C17.6 37.8 31 26.4 31 15.8 31 7.6 24.3 1 16 1z"
                  fill={color}
                  stroke="#fff"
                  strokeWidth="2"
                />
                <g
                  transform="translate(4 4)"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {glyph.map((d) => (
                    <path key={d} d={d} />
                  ))}
                </g>
              </svg>
              {t(`categories.${category}`)}
            </li>
          );
        })}
      </ul>
    </details>
  );
}
