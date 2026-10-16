import { useTranslations } from 'next-intl';
import { buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link } from '@/i18n/navigation';

export default function ProfileNotFound() {
  const t = useTranslations('profile');
  return (
    <main className="page">
      <EmptyState
        action={
          <Link href="/" className={buttonClass()}>
            {t('home')}
          </Link>
        }
      >
        {t('notFound')}
      </EmptyState>
    </main>
  );
}
