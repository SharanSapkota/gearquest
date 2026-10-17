import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { redirect } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function EditProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: '/', locale });
  const t = await getTranslations('profile');
  return (
    <main className="page page--form">
      <h1>{t('editTitle')}</h1>
      <ProfileForm user={user} />
    </main>
  );
}
