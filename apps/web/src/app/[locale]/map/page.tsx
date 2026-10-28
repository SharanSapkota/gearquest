import { getTranslations, setRequestLocale } from 'next-intl/server';
import { staticPageMetadata } from '@/lib/seo/staticMetadata';
import { MapExperience } from '@/components/map/MapExperience';
import { parseGearSearchParams, type SearchParams } from '@/lib/gearFilters';
import { initialView, parseMapView } from '@/lib/mapView';

export const generateMetadata = staticPageMetadata('map', 'seo.mapTitle', 'mapDescription');

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
    <main>
      <h1 className="sr-only">{t('title')}</h1>
      <MapExperience filters={filters} view={view} searchValues={sp} />
    </main>
  );
}
