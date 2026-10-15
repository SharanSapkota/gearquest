import { useTranslations } from 'next-intl';

export default function Loading() {
  const t = useTranslations('profile');
  return (
    <main className="page" aria-busy="true">
      <p className="state">{t('loading')}</p>
    </main>
  );
}
