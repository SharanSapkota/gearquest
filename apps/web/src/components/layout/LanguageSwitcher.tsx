'use client';

import { useLocale, useTranslations } from 'next-intl';
import { LOCALES } from '@gearshare/shared';
import { usePathname, useRouter } from '@/i18n/navigation';

// Segmented FI | EN control.
export function LanguageSwitcher() {
  const t = useTranslations('language');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const change = (next: string) => {
    if (next === locale) return;
    // Read at event time so filters in the URL survive the switch.
    const query = Object.fromEntries(new URLSearchParams(window.location.search));
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
