import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function RentalNotFound() {
  const t = useTranslations('rentals');
  return (
    <main className="page">
      <p className="state">{t('notFound')}</p>
      <Link href="/rentals">{t('back')}</Link>
    </main>
  );
}
