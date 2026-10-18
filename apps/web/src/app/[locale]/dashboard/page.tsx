import { cookies } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { requireUser } from '@/lib/auth';
import { VIEW_COOKIE, dashboardFor, parseView } from '@/lib/roles';

// Entry point of "Dashboard": owners to hosting, renters to renting, "both" to the last used view.
export default async function DashboardIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale, '/dashboard');
  const lastView = parseView((await cookies()).get(VIEW_COOKIE)?.value);
  return redirect({ href: dashboardFor(user.role, lastView), locale });
}
