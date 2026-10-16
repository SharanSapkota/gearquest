import { useTranslations } from 'next-intl';
import { buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchIcon } from '@/components/ui/icons';
import { Link } from '@/i18n/navigation';
import type { PublicGear } from '@/lib/api';
import { GearCard } from './GearCard';

export function GearGrid({ items }: { items: PublicGear[] }) {
  const t = useTranslations();
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<SearchIcon size={34} />}
        title={t('home.emptyTitle')}
        action={
          <Link href="/" className={buttonClass({ variant: 'outline' })}>
            {t('filters.reset')}
          </Link>
        }
      >
        {t('home.empty')}
      </EmptyState>
    );
  }
  return (
    <ul className="grid">
      {items.map((g, i) => (
        // --i staggers the fade-up on load (capped so long lists do not wait).
        <li key={g.id} style={{ '--i': Math.min(i, 11) } as React.CSSProperties}>
          <GearCard gear={g} priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}
