import type { ReactNode } from 'react';

export type Stat = { key: string; label: string; value: string; icon: ReactNode; highlight?: boolean };

// Header summary row of the owner dashboard. Values arrive formatted (counts, money).
export function SummaryCards({ stats, label }: { stats: Stat[]; label: string }) {
  return (
    <ul className="stats" aria-label={label}>
      {stats.map((s) => (
        <li key={s.key} className={s.highlight ? 'stat stat--highlight' : 'stat'}>
          <span className="stat__icon">{s.icon}</span>
          <span className="stat__value num">{s.value}</span>
          <span className="stat__label">{s.label}</span>
        </li>
      ))}
    </ul>
  );
}
