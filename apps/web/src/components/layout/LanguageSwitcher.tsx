'use client';

import { useLocale, useTranslations } from 'next-intl';
import { LOCALES } from '@gearshare/shared';
import { usePathname, useRouter } from '@/i18n/navigation';

export function LanguageSwitcher() {
  const t = useTranslations('language');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const change = (next: string) => {
    // Read at event time so filters in the URL survive the switch.
    const query = Object.fromEntries(new URLSearchParams(window.location.search));
    router.replace({ pathname, query }, { locale: next });
  };

  return (
    <select
      aria-label={t('label')}
      value={locale}
      onChange={(e) => change(e.target.value)}
      className="lang"
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>
          {t(l)}
        </option>
      ))}
    </select>
  );
}
