import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function GearNotFound() {
  const t = useTranslations('gearDetail');
  return (
    <main className="page">
      <p className="state">{t('notFound')}</p>
      <Link href="/">{t('back')}</Link>
    </main>
  );
}
