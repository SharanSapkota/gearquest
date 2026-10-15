'use client';

import { useTranslations } from 'next-intl';
import { RENTAL_STATUSES } from '@gearshare/shared';
import { useRouter } from '@/i18n/navigation';

// Status lives in the URL (page resets to 1), so the list stays shareable and server-rendered.
export function RentalsFilter({ role, status }: { role: string; status?: string }) {
  const t = useTranslations('rentals');
  const router = useRouter();
  return (
    <label className="field rentals-filter">
      {t('filterStatus')}
      <select
        value={status ?? ''}
        onChange={(e) => {
          const params = new URLSearchParams({ role });
          if (e.target.value) params.set('status', e.target.value);
          router.push(`/rentals?${params.toString()}`);
        }}
      >
        <option value="">{t('allStatuses')}</option>
        {RENTAL_STATUSES.map((s) => (
          <option key={s} value={s}>
            {t(`status.${s}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
