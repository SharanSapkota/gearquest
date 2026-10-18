import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SignInPanel } from '@/components/auth/SignInPanel';
import { Card } from '@/components/ui/Card';
import { redirect } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/auth';
import { afterLoginPath } from '@/lib/onboarding';
import { safeRedirect } from '@/lib/safeRedirect';

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Same Google flow as sign in, plus the intermediary disclaimer and the required terms checkbox.
export default async function SignupPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const next = safeRedirect(one(sp.next));
  const user = await getCurrentUser();
  if (user) return redirect({ href: afterLoginPath(user, next), locale });
  const t = await getTranslations('auth');
  return (
    <main className="page page--form auth-page">
      <h1>{t('signupTitle')}</h1>
      <p className="lead">{t('signupLead')}</p>
      {one(sp.terms) === '1' && (
        <p role="status" className="note">
          {t('termsRequired')}
        </p>
      )}
      <Card>
        <SignInPanel mode="signup" next={next} />
      </Card>
    </main>
  );
}
