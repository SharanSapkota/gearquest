'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { AlertIcon } from '@/components/ui/icons';

export default function ErrorState({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('errors');
  return (
    <main className="page" role="alert">
      <EmptyState
        icon={<AlertIcon size={34} />}
        title={t('title')}
        action={<Button onClick={reset}>{t('retry')}</Button>}
      >
        {t('loadFailed')}
      </EmptyState>
    </main>
  );
}
