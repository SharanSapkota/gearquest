import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function EditGearNotFound() {
  const t = useTranslations('myGear');
  return (
    <main className="page">
      <p className="state">{t('notFound')}</p>
      <Link href="/gear/mine">{t('back')}</Link>
    </main>
  );
}
