import { getTranslations, setRequestLocale } from 'next-intl/server';
import { pageTitle } from '@/lib/metadata';
import { LoginPanel } from '@/components/auth/LoginPanel';
import { Card } from '@/components/ui/Card';
import { redirect } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/auth';
import { afterLoginPath } from '@/lib/roles';
import { safeRedirect } from '@/lib/safeRedirect';

export const generateMetadata = pageTitle('auth.loginTitle');

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const next = safeRedirect(one((await searchParams).next), '');
  const user = await getCurrentUser();
  if (user) return redirect({ href: afterLoginPath(user, next), locale });
  const t = await getTranslations('auth');
  return (
    <main className="page page--form auth-page">
      <h1>{t('loginTitle')}</h1>
      <p className="lead">{t('loginLead')}</p>
      <Card>
        <LoginPanel next={next || undefined} />
      </Card>
    </main>
  );
}
