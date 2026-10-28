import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { RememberView } from '@/components/dashboard/RememberView';
import { RequestRow } from '@/components/dashboard/RequestRow';
import { OwnerGate } from '@/components/dashboard/OwnerGate';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { ViewSwitcher } from '@/components/dashboard/ViewSwitcher';
import { MyGearList } from '@/components/gear/MyGearList';
import { buttonClass } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { CalendarIcon, ClockIcon, PlusIcon, TentIcon, WalletIcon } from '@/components/ui/icons';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { requireOwnerAccess } from '@/lib/auth';
import { formatMoney } from '@/lib/format';
import { DASHBOARD_PATHS } from '@/lib/roles';

import { pageTitle } from '@/lib/metadata';
export const generateMetadata = pageTitle('nav.dashboard');

export default async function OwnerDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const access = await requireOwnerAccess(locale, DASHBOARD_PATHS.owner);
  if (access.gate) return <OwnerGate next={DASHBOARD_PATHS.owner} />;
  const t = await getTranslations('dashboard');
  // Failures throw to the locale error boundary (error.tsx), which shows the retry state.
  const { counts, earningsCents, pendingRequests, listings } = await api.getOwnerDashboard();
  const num = new Intl.NumberFormat(await getLocale());

  return (
    <main className="page">
      <RememberView view="owner" />
      <div className="page__head">
        <h1>{t('ownerTitle')}</h1>
        <div className="page__head-actions">
          {access.user.role === 'both' && <ViewSwitcher current="owner" />}
          <Link href="/gear/new" className={buttonClass({ variant: 'accent' })}>
            <PlusIcon size={18} />
            {t('addGear')}
          </Link>
        </div>
      </div>

      <SummaryCards
        label={t('summary')}
        stats={[
          { key: 'listings', label: t('activeListings'), value: num.format(counts.activeListings), icon: <TentIcon size={20} /> },
          { key: 'pending', label: t('pendingRequests'), value: num.format(counts.pendingRequests), icon: <ClockIcon size={20} />, highlight: counts.pendingRequests > 0 },
          { key: 'upcoming', label: t('upcomingRentals'), value: num.format(counts.upcomingRentals), icon: <CalendarIcon size={20} /> },
          { key: 'earnings', label: t('earnings'), value: formatMoney(earningsCents, locale), icon: <WalletIcon size={20} /> },
        ]}
      />

      <section className="dash-section" aria-labelledby="pending-h">
        <div className="dash-section__head">
          <h2 id="pending-h">{t('pendingTitle')}</h2>
          <Link href="/rentals?role=owner">{t('allRequests')}</Link>
        </div>
        {pendingRequests.length === 0 ? (
          <p className="note">{t('noPending')}</p>
        ) : (
          <ul className="request-list">
            {pendingRequests.map((rental) => (
              <RequestRow key={rental.id} rental={rental} />
            ))}
          </ul>
        )}
      </section>

      <section className="dash-section" aria-labelledby="listings-h">
        <div className="dash-section__head">
          <h2 id="listings-h">{t('listingsTitle')}</h2>
        </div>
        {listings.length === 0 ? (
          <EmptyState
            icon={<TentIcon size={34} />}
            title={t('emptyListingsTitle')}
            action={
              <Link href="/gear/new" className={buttonClass()}>
                <PlusIcon size={18} />
                {t('addFirstGear')}
              </Link>
            }
          >
            {t('emptyListings')}
          </EmptyState>
        ) : (
          <MyGearList initial={listings} />
        )}
      </section>
    </main>
  );
}
