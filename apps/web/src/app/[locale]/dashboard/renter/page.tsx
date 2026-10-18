import { getTranslations, setRequestLocale } from 'next-intl/server';
import { RememberView } from '@/components/dashboard/RememberView';
import { ViewSwitcher } from '@/components/dashboard/ViewSwitcher';
import { RentalCard } from '@/components/rentals/RentalCard';
import { buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { CalendarIcon, FindIcon, HandshakeIcon } from '@/components/ui/icons';
import { Link } from '@/i18n/navigation';
import { api, type Rental } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { getNow } from '@/lib/format';
import { DASHBOARD_PATHS } from '@/lib/roles';

function Section({
  id,
  title,
  rentals,
  empty,
  nowMs,
}: {
  id: string;
  title: string;
  rentals: Rental[];
  empty: string;
  nowMs: number;
}) {
  return (
    <section className="dash-section" aria-labelledby={id}>
      <div className="dash-section__head">
        <h2 id={id}>{title}</h2>
      </div>
      {rentals.length === 0 ? (
        <p className="note">{empty}</p>
      ) : (
        <div className="rental-list">
          {rentals.map((rental) => (
            <RentalCard key={rental.id} rental={rental} nowMs={nowMs} />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function RenterDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale, DASHBOARD_PATHS.renter);
  const t = await getTranslations('dashboard');
  // Failures throw to the locale error boundary (error.tsx), which shows the retry state.
  const { upcoming, pending, past } = await api.getRenterDashboard();
  const nowMs = getNow();
  const nothingYet = upcoming.length + pending.length + past.length === 0;

  return (
    <main className="page">
      {user.role === 'both' && <RememberView view="renter" />}
      <div className="page__head">
        <h1>{t('renterTitle')}</h1>
        <div className="page__head-actions">
          {user.role === 'both' && <ViewSwitcher current="renter" />}
          <Link href="/" className={buttonClass()}>
            <FindIcon size={18} />
            {t('findGear')}
          </Link>
        </div>
      </div>

      {user.role === 'renter' && (
        <aside className="promo contour">
          <span className="promo__icon">
            <HandshakeIcon size={26} />
          </span>
          <div className="promo__body">
            <h2>{t('becomeOwnerTitle')}</h2>
            <p>{t('becomeOwnerBody')}</p>
          </div>
          <Link
            href={{ pathname: '/become-owner', query: { next: DASHBOARD_PATHS.owner } }}
            className={buttonClass({ variant: 'secondary' })}
          >
            {t('becomeOwner')}
          </Link>
        </aside>
      )}

      {nothingYet ? (
        <EmptyState
          icon={<CalendarIcon size={34} />}
          title={t('renterEmptyTitle')}
          action={
            <Link href="/" className={buttonClass()}>
              {t('findGear')}
            </Link>
          }
        >
          {t('renterEmpty')}
        </EmptyState>
      ) : (
        <>
          <Section id="upcoming-h" title={t('upcomingTitle')} rentals={upcoming} empty={t('noUpcoming')} nowMs={nowMs} />
          <Section id="requests-h" title={t('requestsTitle')} rentals={pending} empty={t('noRequests')} nowMs={nowMs} />
          <Section id="past-h" title={t('pastTitle')} rentals={past} empty={t('noPast')} nowMs={nowMs} />
        </>
      )}
    </main>
  );
}
