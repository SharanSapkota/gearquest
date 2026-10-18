import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { requireUser } from '@/lib/auth';
import { safeRedirect } from '@/lib/safeRedirect';

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function EditProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale, '/profile/edit');
  const sp = await searchParams;
  const t = await getTranslations('profile');
  return (
    <main className="page page--form">
      <h1>{t('editTitle')}</h1>
      <ProfileForm
        user={user}
        becomeOwner={one(sp.become) === 'owner'}
        next={safeRedirect(one(sp.next), `/users/${user.id}`)}
      />
    </main>
  );
}
