'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { DASHBOARD_PATHS, type DashboardView } from '@/lib/roles';

// Segmented "Renting / Hosting" switch for users with role "both". The choice is remembered by
// RememberView on the dashboard page, so the links themselves stay plain navigation.
export function ViewSwitcher({ current }: { current: DashboardView }) {
  const t = useTranslations('dashboard');
  const items: [DashboardView, string][] = [
    ['renter', t('renting')],
    ['owner', t('hosting')],
  ];
  return (
    <nav className="tabs tabs--page" aria-label={t('switchLabel')}>
      {items.map(([view, label]) => (
        <Link
          key={view}
          href={DASHBOARD_PATHS[view]}
          className={view === current ? 'tab tab--active' : 'tab'}
          aria-current={view === current ? 'page' : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
