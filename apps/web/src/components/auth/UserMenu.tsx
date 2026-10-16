'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { Link, useRouter } from '@/i18n/navigation';
import { api, type Me } from '@/lib/api';

export function UserMenu({ user, pendingCount }: { user: Me; pendingCount: number }) {
  const t = useTranslations('nav');
  const router = useRouter();
  const toast = useToast();
  const menu = useRef<HTMLDetailsElement>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    if (menu.current) menu.current.open = false;
  };

  const logout = async () => {
    setBusy(true);
    try {
      await api.logout();
      close();
      router.push('/');
      router.refresh();
    } catch {
      toast(t('logoutFailed'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <details className="popover" ref={menu}>
      <summary className="popover__trigger popover__trigger--avatar" aria-label={user.name}>
        <Avatar name={user.name} url={user.avatarUrl} size={36} />
        {pendingCount > 0 && (
          <span className="count-badge" aria-label={t('pendingRequests', { count: pendingCount })}>
            {pendingCount}
          </span>
        )}
      </summary>
      <div className="popover__panel" onClick={(e) => (e.target as HTMLElement).closest('a') && close()}>
        <p className="popover__note">{user.name}</p>
        <Link href={`/users/${user.id}`}>{t('myProfile')}</Link>
        <Link href="/gear/mine">{t('myGear')}</Link>
        <Link href="/rentals">
          {t('rentals')}
          {pendingCount > 0 && <span className="count-badge">{pendingCount}</span>}
        </Link>
        <button type="button" onClick={() => void logout()} disabled={busy}>
          {t('logout')}
        </button>
      </div>
    </details>
  );
}
