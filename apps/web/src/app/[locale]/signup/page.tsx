import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SignupFlow } from '@/components/auth/SignupFlow';
import { Card } from '@/components/ui/Card';
import { redirect } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/auth';
import { afterLoginPath } from '@/lib/roles';
import { safeRedirect } from '@/lib/safeRedirect';

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Role first, then terms (and owner phone + consent), then Google. The account is created only
// after the API has verified the Google token.
export default async function SignupPage({
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
      <h1>{t('signupTitle')}</h1>
      <p className="lead">{t('signupLead')}</p>
      <Card>
        <SignupFlow next={next || undefined} />
      </Card>
    </main>
  );
}
