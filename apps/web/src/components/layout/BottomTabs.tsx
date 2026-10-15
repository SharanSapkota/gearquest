'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { CalendarIcon, HomeIcon, MapIcon, PlusIcon, UserIcon } from '@/components/ui/icons';
import { Link, usePathname } from '@/i18n/navigation';
import { carryFilterParams } from '@/lib/mapView';

const SignInSheet = dynamic(() => import('@/components/auth/SignInSheet'), { ssr: false });

type Tab = {
  key: string;
  href: string | { pathname: string; query: Record<string, string> };
  label: string;
  icon: ReactNode;
  active: boolean;
  badge?: number;
  add?: boolean;
};

// Phone-only tab bar. Signed in: Home, Map, Add gear, Rentals, Profile. Guests: Home, Map, Sign in.
export function BottomTabs({ pendingCount }: { pendingCount: number }) {
  const t = useTranslations('nav');
  const user = useAuth();
  const pathname = usePathname();
  const search = useSearchParams();
  const [signInOpen, setSignInOpen] = useState(false);
  const query = Object.fromEntries(new URLSearchParams(carryFilterParams(search.toString())));

  const tabs: Tab[] = [
    { key: 'home', href: { pathname: '/', query }, label: t('home'), icon: <HomeIcon size={22} />, active: pathname === '/' },
    { key: 'map', href: { pathname: '/map', query }, label: t('map'), icon: <MapIcon size={22} />, active: pathname.startsWith('/map') },
  ];
  if (user) {
    tabs.push(
      { key: 'add', href: '/gear/new', label: t('addGear'), icon: <PlusIcon size={24} />, active: pathname.startsWith('/gear/new'), add: true },
      { key: 'rentals', href: '/rentals', label: t('rentalsShort'), icon: <CalendarIcon size={22} />, active: pathname.startsWith('/rentals'), badge: pendingCount },
      { key: 'profile', href: `/users/${user.id}`, label: t('profile'), icon: <UserIcon size={22} />, active: pathname.startsWith('/users/') || pathname.startsWith('/profile') || pathname.startsWith('/gear/mine') },
    );
  }

  return (
    <>
      <nav className="tabbar" aria-label={t('main')}>
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={tab.add ? 'tabbar__item tabbar__item--add' : 'tabbar__item'}
            aria-current={tab.active ? 'page' : undefined}
          >
            {tab.add ? <span className="tabbar__plus">{tab.icon}</span> : tab.icon}
            {tab.label}
            {!!tab.badge && (
              <span className="count-badge" aria-label={t('pendingRequests', { count: tab.badge })}>
                {tab.badge}
              </span>
            )}
          </Link>
        ))}
        {!user && (
          <button type="button" className="tabbar__item" onClick={() => setSignInOpen(true)} aria-haspopup="dialog">
            <UserIcon size={22} />
            {t('signIn')}
          </button>
        )}
      </nav>
      {signInOpen && <SignInSheet onClose={() => setSignInOpen(false)} />}
    </>
  );
}
