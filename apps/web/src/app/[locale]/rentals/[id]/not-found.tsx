import { useTranslations } from 'next-intl';
import { buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link } from '@/i18n/navigation';

export default function RentalNotFound() {
  const t = useTranslations('rentals');
  return (
    <main className="page">
      <EmptyState
        action={
          <Link href="/rentals" className={buttonClass()}>
            {t('back')}
          </Link>
        }
      >
        {t('notFound')}
      </EmptyState>
    </main>
  );
}
