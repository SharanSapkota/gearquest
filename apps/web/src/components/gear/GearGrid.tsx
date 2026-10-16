import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/EmptyState';
import type { PublicGear } from '@/lib/api';
import { GearCard } from './GearCard';

export function GearGrid({ items }: { items: PublicGear[] }) {
  const t = useTranslations('home');
  if (items.length === 0) return <EmptyState>{t('empty')}</EmptyState>;
  return (
    <ul className="grid">
      {items.map((g, i) => (
        <li key={g.id}>
          <GearCard gear={g} priority={i < 3} />
        </li>
      ))}
    </ul>
  );
}
