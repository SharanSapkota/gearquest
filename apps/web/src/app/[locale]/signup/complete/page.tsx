import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CompleteSignupForm } from '@/components/auth/CompleteSignupForm';
import { buttonClass } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link, redirect } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { afterLoginPath } from '@/lib/roles';
import { safeRedirect } from '@/lib/safeRedirect';

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// "Create your account": where "Sign in" sends a Google account that has no GearShare account yet.
export default async function CompleteSignupPage({
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
  const profile = await api.getPendingSignup();
  const t = await getTranslations('signup');
  return (
    <main className="page page--form auth-page">
      <h1>{t('completeTitle')}</h1>
      {profile ? (
        <>
          <p className="lead">{t('completeLead')}</p>
          <Card>
            <CompleteSignupForm profile={profile} next={next || undefined} />
          </Card>
        </>
      ) : (
        <EmptyState
          title={t('expiredTitle')}
          action={
            <Link href="/login" className={buttonClass()}>
              {t('backToLogin')}
            </Link>
          }
        >
          {t('expired')}
        </EmptyState>
      )}
    </main>
  );
}
