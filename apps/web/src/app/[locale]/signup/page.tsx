import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SignInPanel } from '@/components/auth/SignInPanel';
import { Card } from '@/components/ui/Card';
import { redirect } from '@/i18n/navigation';
import { getCurrentUser } from '@/lib/auth';
import { safeRedirect } from '@/lib/safeRedirect';

export default async function SignupPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const next = safeRedirect((await searchParams).next);
  const user = await getCurrentUser();
  if (user) {
    return redirect({
      href: user.onboardingCompleted ? next : { pathname: '/onboarding', query: { next } },
      locale,
    });
  }
  const t = await getTranslations('auth');
  return (
    <main className="page page--form auth-page">
      <Card>
        <h1>{t('signUpTitle')}</h1>
        <p className="note">{t('signUpIntro')}</p>
        <SignInPanel mode="signup" next={next} />
      </Card>
    </main>
  );
}
