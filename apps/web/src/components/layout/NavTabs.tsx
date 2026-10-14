'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

export function NavTabs() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const tabs = [
    { href: '/', label: t('home'), active: pathname === '/' },
    { href: '/map', label: t('map'), active: pathname.startsWith('/map') },
  ];
  return (
    <nav className="tabs" aria-label={t('main')}>
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={tab.active ? 'tab tab--active' : 'tab'}
          aria-current={tab.active ? 'page' : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
