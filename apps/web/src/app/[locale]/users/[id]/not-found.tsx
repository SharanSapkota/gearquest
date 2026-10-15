import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function ProfileNotFound() {
  const t = useTranslations('profile');
  return (
    <main className="page">
      <p className="state">{t('notFound')}</p>
      <Link href="/">{t('home')}</Link>
    </main>
  );
}
