import { useTranslations } from 'next-intl';
import { MapIcon } from '@/components/ui/icons';

// Friendly fallback when the key is missing or Google Maps fails to load.
export function MapUnavailable({ reason }: { reason: 'missingKey' | 'failed' }) {
  const t = useTranslations('map.unavailable');
  return (
    <div className="map-fallback contour" role="status">
      <span className="state__art">
        <MapIcon size={32} />
      </span>
      <h3>{t('title')}</h3>
      <p>{t(reason)}</p>
    </div>
  );
}
