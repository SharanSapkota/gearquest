import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FilterBar } from '@/components/filters/FilterBar';
import { MapExperience } from '@/components/map/MapExperience';
import { parseGearSearchParams, type SearchParams } from '@/lib/gearFilters';
import { initialView, parseMapView } from '@/lib/mapView';

export default async function MapPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations('map');
  const filters = parseGearSearchParams(sp);
  const view = initialView(parseMapView(sp), filters);

  return (
    <main className="map-page">
      <h1 className="sr-only">{t('title')}</h1>
      <div className="map-layout">
        <FilterBar basePath="/map" values={sp} preserve={['center', 'zoom']} />
        <MapExperience filters={filters} view={view} />
      </div>
    </main>
  );
}
