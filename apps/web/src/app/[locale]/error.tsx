'use client';

import { useTranslations } from 'next-intl';

export default function ErrorState({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('errors');
  return (
    <main className="page">
      <p className="state" role="alert">
        {t('loadFailed')}
      </p>
      <button type="button" onClick={reset}>
        {t('retry')}
      </button>
    </main>
  );
}
