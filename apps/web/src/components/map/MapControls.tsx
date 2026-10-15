'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { IconButton } from '@/components/ui/Button';
import { LocateIcon, MinusIcon, PlusIcon } from '@/components/ui/icons';

const LOCATE_ZOOM = 12;
type LocateState = 'idle' | 'locating' | 'denied' | 'failed';

// Floating zoom and "use my location" buttons (48px, right edge: reachable with a thumb).
export function MapControls({ map }: { map: google.maps.Map | null }) {
  const t = useTranslations('map');
  const [locate, setLocate] = useState<LocateState>('idle');

  const useMyLocation = () => {
    if (!map) return;
    if (!navigator.geolocation) {
      setLocate('failed');
      return;
    }
    setLocate('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocate('idle');
        map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        if ((map.getZoom() ?? 0) < LOCATE_ZOOM) map.setZoom(LOCATE_ZOOM);
      },
      (err) => setLocate(err.code === err.PERMISSION_DENIED ? 'denied' : 'failed'),
      { timeout: 10_000, maximumAge: 60_000 },
    );
  };

  return (
    <>
      <div className="mapx__controls">
        <IconButton
          label={locate === 'locating' ? t('locating') : t('locate')}
          variant="float"
          className={locate === 'locating' ? 'btn--locating' : undefined}
          disabled={!map || locate === 'locating'}
          onClick={useMyLocation}
        >
          <LocateIcon size={22} />
        </IconButton>
        <div className="mapx__zoom">
          <IconButton
            label={t('zoomIn')}
            variant="float"
            disabled={!map}
            onClick={() => map?.setZoom((map.getZoom() ?? 0) + 1)}
          >
            <PlusIcon size={22} />
          </IconButton>
          <IconButton
            label={t('zoomOut')}
            variant="float"
            disabled={!map}
            onClick={() => map?.setZoom((map.getZoom() ?? 0) - 1)}
          >
            <MinusIcon size={22} />
          </IconButton>
        </div>
      </div>
      {(locate === 'denied' || locate === 'failed') && (
        <p role="status" className="map-note mapx__locate-note">
          {locate === 'denied' ? t('locateDenied') : t('locateFailed')}
        </p>
      )}
    </>
  );
}
