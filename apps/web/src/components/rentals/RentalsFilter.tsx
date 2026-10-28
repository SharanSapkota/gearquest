'use client';

import { useTranslations } from 'next-intl';
import { RENTAL_STATUSES } from '@gearquest/shared';
import { Chip } from '@/components/ui/Chip';
import { useRouter } from '@/i18n/navigation';

// Status lives in the URL (page resets to 1), so the list stays shareable and server-rendered.
export function RentalsFilter({ role, status }: { role: string; status?: string }) {
  const t = useTranslations('rentals');
  const router = useRouter();
  const go = (next?: string) => {
    const params = new URLSearchParams({ role });
    if (next) params.set('status', next);
    router.push(`/rentals?${params.toString()}`);
  };
  return (
    <div className="chips" role="group" aria-label={t('filterStatus')}>
      <Chip pressed={!status} onClick={() => go()}>
        {t('allStatuses')}
      </Chip>
      {RENTAL_STATUSES.map((s) => (
        <Chip key={s} pressed={status === s} onClick={() => go(status === s ? undefined : s)}>
          {t(`status.${s}`)}
        </Chip>
      ))}
    </div>
  );
}
