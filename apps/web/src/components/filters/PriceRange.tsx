'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { formatMoney } from '@/lib/format';

const MAX = 300; // EUR; the right end means "no upper limit"
const STEP = 5;

const clamp = (n: number) => Math.min(MAX, Math.max(0, n));

// Dual-handle price slider (EUR). Writes minPrice / maxPrice (the URL's units) as hidden inputs;
// untouched values pass through unchanged, so a hand-edited URL is never rewritten by Apply.
export function PriceRange({ initialMin, initialMax }: { initialMin: string; initialMax: string }) {
  const t = useTranslations('filters');
  const locale = useLocale();
  const [min, setMin] = useState(initialMin === '' ? 0 : clamp(Number(initialMin) || 0));
  const [max, setMax] = useState(initialMax === '' ? MAX : clamp(Number(initialMax) || MAX));
  const [touched, setTouched] = useState(false);

  const outMin = touched ? (min > 0 ? String(min) : '') : initialMin;
  const outMax = touched ? (max < MAX ? String(max) : '') : initialMax;
  const money = (n: number) => formatMoney(n * 100, locale).replace(/[,.]00(?=\s)/, '');
  const pct = (n: number) => `${(n / MAX) * 100}%`;

  return (
    <div className="range">
      <input type="hidden" name="minPrice" value={outMin} />
      <input type="hidden" name="maxPrice" value={outMax} />
      <div className="range__values" aria-hidden="true">
        <span>{money(min)}</span>
        <span>{max >= MAX ? `${money(MAX)}+` : money(max)}</span>
      </div>
      <div className="range__track">
        <span className="range__rail" />
        <span className="range__fill" style={{ left: pct(min), right: `calc(100% - ${pct(max)})` }} />
        <input
          type="range"
          min={0}
          max={MAX}
          step={STEP}
          value={min}
          aria-label={t('minPrice')}
          onChange={(e) => {
            setTouched(true);
            setMin(Math.min(Number(e.target.value), max - STEP));
          }}
        />
        <input
          type="range"
          min={0}
          max={MAX}
          step={STEP}
          value={max}
          aria-label={t('maxPrice')}
          onChange={(e) => {
            setTouched(true);
            setMax(Math.max(Number(e.target.value), min + STEP));
          }}
        />
      </div>
    </div>
  );
}
