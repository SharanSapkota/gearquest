'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Link, useRouter } from '@/i18n/navigation';
import { api, type Me } from '@/lib/api';

export function UserMenu({ user }: { user: Me }) {
  const t = useTranslations('nav');
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const logout = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await api.logout();
      router.push('/');
      router.refresh();
    } catch {
      setFailed(true);
      setBusy(false);
    }
  };

  return (
    <details className="popover">
      <summary className="popover__trigger" aria-label={user.name}>
        <Avatar name={user.name} url={user.avatarUrl} />
      </summary>
      <div className="popover__panel">
        <p className="popover__note">{user.name}</p>
        <Link href={`/users/${user.id}`}>{t('myProfile')}</Link>
        <Link href="/rentals">{t('rentals')}</Link>
        <button type="button" onClick={() => void logout()} disabled={busy}>
          {t('logout')}
        </button>
        {failed && <p role="alert">{t('logoutFailed')}</p>}
      </div>
    </details>
  );
}
