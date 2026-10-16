import { getTranslations, setRequestLocale } from 'next-intl/server';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/gear/Pagination';
import { RentalCard } from '@/components/rentals/RentalCard';
import { RentalsFilter } from '@/components/rentals/RentalsFilter';
import { Link, redirect } from '@/i18n/navigation';
import { api, type RentalStatus } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { getNow } from '@/lib/format';
import { RENTAL_STATUSES } from '@gearshare/shared';

const LIMIT = 20;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function RentalsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (!user) return redirect({ href: '/', locale });
  const t = await getTranslations('rentals');

  const sp = await searchParams;
  const role = one(sp.role) === 'owner' ? 'owner' : 'renter';
  const rawStatus = one(sp.status);
  const status = RENTAL_STATUSES.find((s) => s === rawStatus) as RentalStatus | undefined;
  const page = Math.max(1, Number.parseInt(one(sp.page) ?? '1', 10) || 1);

  // Failures throw to the locale error boundary (error.tsx), which shows the retry state.
  const { items, total } = await api.listMyRentals({ role, status, page, limit: LIMIT });
  const nowMs = getNow();
  const tabHref = (r: string) => `/rentals?role=${r}`;

  return (
    <main className="page">
      <h1>{t('title')}</h1>
      <nav className="tabs tabs--page" aria-label={t('tabs')}>
        {(['renter', 'owner'] as const).map((r) => (
          <Link
            key={r}
            href={tabHref(r)}
            className={r === role ? 'tab tab--active' : 'tab'}
            aria-current={r === role ? 'page' : undefined}
          >
            {t(r === 'renter' ? 'asRenter' : 'asOwner')}
          </Link>
        ))}
      </nav>
      <RentalsFilter role={role} status={status} />
      {items.length === 0 ? (
        <EmptyState>{t(role === 'renter' ? 'emptyRenter' : 'emptyOwner')}</EmptyState>
      ) : (
        <div className="rental-list">
          {items.map((rental) => (
            <RentalCard key={rental.id} rental={rental} nowMs={nowMs} />
          ))}
        </div>
      )}
      <Pagination
        page={page}
        total={total}
        limit={LIMIT}
        basePath="/rentals"
        searchParams={{ role, status }}
      />
    </main>
  );
}
