import { useTranslations } from 'next-intl';
import { GearGridSkeleton, Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  const t = useTranslations('home');
  return (
    <main aria-busy="true">
      <h1 className="sr-only">{t('title')}</h1>
      <p className="sr-only" role="status">
        {t('loading')}
      </p>
      <div className="band">
        <Skeleton style={{ height: 120, borderRadius: 24, opacity: 0.15 }} />
      </div>
      <div className="page">
        <GearGridSkeleton />
      </div>
    </main>
  );
}
