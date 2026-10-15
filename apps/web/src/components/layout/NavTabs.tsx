'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link, usePathname } from '@/i18n/navigation';
import { carryFilterParams } from '@/lib/mapView';

export function NavTabs() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const search = useSearchParams();
  // Filters carry over between Home and Map; page and map position stay with their own tab.
  const query = Object.fromEntries(new URLSearchParams(carryFilterParams(search.toString())));
  const tabs = [
    { href: { pathname: '/', query }, label: t('home'), active: pathname === '/' },
    { href: { pathname: '/map', query }, label: t('map'), active: pathname.startsWith('/map') },
  ];
  return (
    <nav className="tabs" aria-label={t('main')}>
      {tabs.map((tab) => (
        <Link
          key={tab.href.pathname}
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
