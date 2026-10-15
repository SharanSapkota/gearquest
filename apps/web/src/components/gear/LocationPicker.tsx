'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { LngLat } from './LocationMap';

// Leaflet touches `window`, so it is client-only.
const LocationMap = dynamic(() => import('./LocationMap'), {
  ssr: false,
  loading: () => <div className="location-map location-map--loading" aria-busy="true" />,
});

export function LocationPicker({
  position,
  onPositionChange,
  city,
  onCityChange,
  locationError,
  cityError,
}: {
  position: LngLat | null;
  onPositionChange: (p: LngLat) => void;
  city: string;
  onCityChange: (city: string) => void;
  locationError?: string;
  cityError?: string;
}) {
  const t = useTranslations('gearForm.location');
  const [focusKey, setFocusKey] = useState(0);
  const [geoFailed, setGeoFailed] = useState(false);

  const useMyLocation = () => {
    setGeoFailed(false);
    if (!navigator.geolocation) {
      setGeoFailed(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onPositionChange({ lng: pos.coords.longitude, lat: pos.coords.latitude });
        setFocusKey((k) => k + 1);
      },
      () => setGeoFailed(true),
    );
  };

  return (
    <fieldset className="field">
      <legend>{t('label')}</legend>
      <small>{t('hint')}</small>
      <LocationMap position={position} focusKey={focusKey} onChange={onPositionChange} label={t('mapLabel')} />
      <div>
        <button type="button" onClick={useMyLocation}>
          {t('useMine')}
        </button>
      </div>
      {geoFailed && <span role="alert">{t('geoFailed')}</span>}
      {locationError && <span role="alert">{locationError}</span>}
      <p className="note">{t('privacy')}</p>
      <label className="field">
        {t('city')}
        <input value={city} onChange={(e) => onCityChange(e.target.value)} maxLength={100} />
        {cityError && <span role="alert">{cityError}</span>}
      </label>
    </fieldset>
  );
}
