import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FilterControls } from '@/components/filters/FilterControls';
import { SegmentedSearch } from '@/components/filters/SegmentedSearch';
import { GearGrid } from '@/components/gear/GearGrid';
import { HowItWorks } from '@/components/gear/HowItWorks';
import { Pagination } from '@/components/gear/Pagination';
import { ShieldCheckIcon } from '@/components/ui/icons';
import { api } from '@/lib/api';
import { formatDate, helsinkiDayStartUtc } from '@/lib/format';
import { parseGearSearchParams, type SearchParams } from '@/lib/gearFilters';

const ymd = (v: string | string[] | undefined) => {
  const s = Array.isArray(v) ? v[0] : v;
  return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : undefined;
};

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations();
  // Errors propagate to error.tsx; an unreachable API falls back to mock data inside api.ts.
  const { items, total, page, limit } = await api.listGear(parseGearSearchParams(sp));
  const from = ymd(sp.from);
  const to = ymd(sp.to);
  const fmt = (d: string) => formatDate(helsinkiDayStartUtc(d), locale);

  return (
    <main>
      <section className="band contour" aria-labelledby="home-title">
        <div className="band__inner">
          <div className="band__text">
            <h1 id="home-title">{t('home.title')}</h1>
            <p className="band__sub">{t('home.subtitle')}</p>
          </div>
          <SegmentedSearch values={sp} />
        </div>
      </section>
      <div className="filterrow">
        <FilterControls basePath="/" values={sp} />
      </div>
      <div className="page">
        <p className="summary" aria-live="polite">
          <span className="num">{t('home.results', { count: total })}</span>
          {from && to && ` · ${t('home.availableRange', { from: fmt(from), to: fmt(to) })}`}
        </p>
        <GearGrid items={items} />
        <Pagination page={page} total={total} limit={limit} basePath="/" searchParams={sp} />
      </div>
      <HowItWorks />
      <p className="trustline">
        <ShieldCheckIcon size={18} />
        {t('home.trust')}
      </p>
    </main>
  );
}
