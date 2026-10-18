import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BecomeOwnerForm } from '@/components/dashboard/BecomeOwnerForm';
import { redirect } from '@/i18n/navigation';
import { requireUser } from '@/lib/auth';
import { DASHBOARD_PATHS, isOwnerReady } from '@/lib/roles';
import { safeRedirect } from '@/lib/safeRedirect';

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// The phone + WhatsApp consent step: for a renter becoming an owner, and for an owner who has not
// added them yet ("Add gear" and the owner dashboard send them here first).
export default async function BecomeOwnerPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const next = safeRedirect(one((await searchParams).next), DASHBOARD_PATHS.owner);
  const user = await requireUser(locale, `/become-owner?next=${encodeURIComponent(next)}`);
  if (isOwnerReady(user)) return redirect({ href: next, locale });
  const t = await getTranslations('becomeOwner');
  return (
    <main className="page page--form">
      <h1>{t('title')}</h1>
      <p className="lead">{t('lead')}</p>
      <BecomeOwnerForm user={user} next={next} />
    </main>
  );
}
