'use client';

import { useLocale, useTranslations } from 'next-intl';
import { LOCALES } from '@gearquest/shared';
import { useAuth } from '@/components/auth/AuthProvider';
import { usePathname, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';

// Segmented FI | EN control.
export function LanguageSwitcher() {
  const t = useTranslations('language');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuth();

  const change = (next: string) => {
    if (next === locale) return;
    // Read at event time so filters in the URL survive the switch.
    const query = Object.fromEntries(new URLSearchParams(window.location.search));
    // next-intl keeps the choice in its NEXT_LOCALE cookie; signed-in users also store it on
    // their account. A failed save never blocks the switch.
    if (user && user.language !== next) void api.updateMe({ language: next as 'fi' | 'en' }).catch(() => undefined);
    router.replace({ pathname, query }, { locale: next });
  };

  return (
    <div className="lang" role="group" aria-label={t('label')}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-label={t(l)}
          aria-pressed={l === locale}
          onClick={() => change(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
