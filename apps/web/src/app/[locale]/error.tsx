'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

export default function ErrorState({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('errors');
  return (
    <main className="page">
      <div className="state" role="alert">
        <p>{t('loadFailed')}</p>
        <Button onClick={reset}>{t('retry')}</Button>
      </div>
    </main>
  );
}
