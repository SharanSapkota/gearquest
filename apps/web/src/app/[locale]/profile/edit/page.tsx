import { getTranslations, setRequestLocale } from 'next-intl/server';
import { USER_ROLES } from '@gearshare/shared';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { requireUser } from '@/lib/auth';

export default async function EditProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ role?: string | string[] }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale, '/profile/edit');
  // "Become an owner" links here with ?role=owner to preselect it.
  const { role } = await searchParams;
  const initialRole = USER_ROLES.find((r) => r === role);
  const t = await getTranslations('profile');
  return (
    <main className="page page--form">
      <h1>{t('editTitle')}</h1>
      <ProfileForm user={user} initialRole={initialRole} />
    </main>
  );
}
