'use client';

import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMap } from 'leaflet';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Circle, MapContainer, TileLayer, ZoomControl, useMapEvents } from 'react-leaflet';
import type { PublicGear } from '@/lib/api';
import { MAX_ZOOM, MIN_ZOOM, formatBbox, type LatLng, type MapView } from '@/lib/mapView';
import { ClusterLayer } from './ClusterLayer';

export type Viewport = { bbox: string; center: LatLng; zoom: number };

const LOCATE_ZOOM = 12;

function ViewportTracker({ onChange }: { onChange: (v: Viewport) => void }) {
  const report = (map: LeafletMap) => {
    const b = map.getBounds();
    const c = map.getCenter();
    onChange({
      bbox: formatBbox(b.getWest(), b.getSouth(), b.getEast(), b.getNorth()),
      center: [c.lat, c.lng],
      zoom: Math.round(map.getZoom()),
    });
  };
  const map = useMapEvents({ moveend: (e) => report(e.target as LeafletMap) });
  useEffect(() => report(map), [map]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

type LocateState = 'idle' | 'locating' | 'denied' | 'failed';

export default function GearMap({
  view,
  items,
  radius,
  onViewportChange,
}: {
  view: MapView;
  items: PublicGear[];
  // Distance filter: drawn as a circle when a centre point and radius are set.
  radius?: { center: LatLng; km: number };
  onViewportChange: (v: Viewport) => void;
}) {
  const t = useTranslations('map');
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [locate, setLocate] = useState<LocateState>('idle');

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocate('failed');
      return;
    }
    setLocate('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocate('idle');
        map?.flyTo([pos.coords.latitude, pos.coords.longitude], Math.max(map.getZoom(), LOCATE_ZOOM));
      },
      (err) => setLocate(err.code === err.PERMISSION_DENIED ? 'denied' : 'failed'),
      { timeout: 10_000, maximumAge: 60_000 },
    );
  };

  return (
    <>
      <MapContainer
        ref={setMap}
        center={view.center}
        zoom={view.zoom}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        zoomControl={false}
        className="map-leaflet"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <ZoomControl position="topright" zoomInTitle={t('zoomIn')} zoomOutTitle={t('zoomOut')} />
        {radius && (
          <Circle
            center={radius.center}
            radius={radius.km * 1000}
            interactive={false}
            pathOptions={{ color: '#1f6f4a', weight: 2, fillOpacity: 0.08 }}
          />
        )}
        <ClusterLayer items={items} />
        <ViewportTracker onChange={onViewportChange} />
      </MapContainer>
      <div className="map-controls">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locate === 'locating'}
          aria-label={t('locate')}
          title={t('locate')}
        >
          {locate === 'locating' ? t('locating') : t('locateShort')}
        </button>
        {(locate === 'denied' || locate === 'failed') && (
          <p role="status" className="map-note">
            {locate === 'denied' ? t('locateDenied') : t('locateFailed')}
          </p>
        )}
      </div>
    </>
  );
}
