import { getTranslations, setRequestLocale } from 'next-intl/server';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { redirect } from '@/i18n/navigation';
import { requireUser } from '@/lib/auth';
import { safeRedirect } from '@/lib/safeRedirect';

export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const next = safeRedirect((await searchParams).next);
  const user = await requireUser(locale, '/onboarding', { allowIncompleteOnboarding: true });
  // Shown once: a finished user goes straight on. (The owner's step 3 is client-side only.)
  if (user.onboardingCompleted) return redirect({ href: next, locale });
  const t = await getTranslations('onboarding');
  return (
    <main className="page page--form">
      <h1>{t('title')}</h1>
      <OnboardingFlow user={user} next={next} />
    </main>
  );
}
