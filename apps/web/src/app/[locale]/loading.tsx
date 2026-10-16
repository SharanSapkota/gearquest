import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  const t = useTranslations('home');
  return (
    <main className="page" aria-busy="true">
      <h1 className="sr-only">{t('title')}</h1>
      <p className="sr-only" role="status">
        {t('loading')}
      </p>
      <Skeleton style={{ height: 170, borderRadius: 24, marginBottom: 20 }} />
      <ul className="grid">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i}>
            <Skeleton style={{ aspectRatio: '4 / 4.2', borderRadius: 24 }} />
          </li>
        ))}
      </ul>
    </main>
  );
}
