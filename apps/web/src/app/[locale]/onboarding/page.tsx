import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { getCurrentUser } from '@/lib/auth';
import { isOwnerRole } from '@/lib/onboarding';
import { safeRedirect } from '@/lib/safeRedirect';

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const sp = await searchParams;
  const next = safeRedirect(one(sp.next));
  const user = await getCurrentUser();
  if (!user) {
    return redirect({ href: { pathname: '/login', query: { next: '/onboarding' } }, locale });
  }
  // Shown once. The only way back in is the owner's last step after switching language.
  const lastStep = one(sp.step) === 'gear' && isOwnerRole(user.role);
  if (user.onboardingCompleted && !lastStep) return redirect({ href: next, locale });
  const t = await getTranslations('onboarding');
  return (
    <main className="page page--form">
      <h1>{t('title')}</h1>
      <OnboardingFlow
        user={user}
        locale={locale}
        next={next}
        initialStep={user.onboardingCompleted ? 'gear' : 'role'}
      />
    </main>
  );
}
