import { useTranslations } from 'next-intl';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

export default function Loading() {
  const t = useTranslations('profile');
  return (
    <main className="page" aria-busy="true">
      <PageSkeleton label={t('loading')} />
    </main>
  );
}
