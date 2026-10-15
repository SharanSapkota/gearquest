import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FilterControls } from '@/components/filters/FilterControls';
import { GearGrid } from '@/components/gear/GearGrid';
import { Pagination } from '@/components/gear/Pagination';
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
    <main className="page">
      <section className="hero">
        <h1>{t('home.title')}</h1>
        <p>{t('home.subtitle')}</p>
        <FilterControls basePath="/" values={sp} />
      </section>
      <p className="summary" aria-live="polite">
        {t('home.results', { count: total })}
        {from && to && ` · ${t('home.availableRange', { from: fmt(from), to: fmt(to) })}`}
      </p>
      <GearGrid items={items} />
      <Pagination page={page} total={total} limit={limit} basePath="/" searchParams={sp} />
    </main>
  );
}
