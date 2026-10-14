import { useTranslations } from 'next-intl';
import type { PublicGear } from '@/lib/api';
import { GearCard } from './GearCard';

export function GearGrid({ items }: { items: PublicGear[] }) {
  const t = useTranslations('home');
  if (items.length === 0) return <p className="state">{t('empty')}</p>;
  return (
    <ul className="grid">
      {items.map((g) => (
        <li key={g.id}>
          <GearCard gear={g} />
        </li>
      ))}
    </ul>
  );
}
