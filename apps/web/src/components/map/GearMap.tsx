'use client';

import { Circle, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import type { PublicGear } from '@/lib/api';
import { MAX_ZOOM, MIN_ZOOM, formatBbox, type LatLng, type MapView } from '@/lib/mapView';
import { ClusterLayer, type MapFocus } from './ClusterLayer';
import { GearPopup } from './GearPopup';
import { GoogleMapShell } from './GoogleMapShell';

export type Viewport = { bbox: string; center: LatLng; zoom: number };

// Reports the visible area once the map settles (Google's `idle` fires after pan/zoom ends).
function ViewportTracker({ onChange }: { onChange: (v: Viewport) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const report = () => {
      const b = map.getBounds()?.toJSON();
      const c = map.getCenter();
      if (!b || !c) return;
      onChange({
        bbox: formatBbox(b.west, b.south, b.east, b.north),
        center: [c.lat(), c.lng()],
        zoom: Math.round(map.getZoom() ?? MIN_ZOOM),
      });
    };
    const listener = map.addListener('idle', report);
    return () => listener.remove();
  }, [map, onChange]);
  return null;
}

// Hands the map instance to the page, which owns the floating controls.
function MapBridge({ onReady }: { onReady: (map: google.maps.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    if (map) onReady(map);
  }, [map, onReady]);
  return null;
}

export default function GearMap({
  view,
  items,
  radius,
  selectedGear,
  focus,
  popup,
  onSelect,
  onViewportChange,
  onMapReady,
}: {
  view: MapView;
  items: PublicGear[];
  // Distance filter: drawn as a circle when a centre point and radius are set.
  radius?: { center: LatLng; km: number };
  selectedGear: PublicGear | null;
  focus: MapFocus | null;
  // Desktop shows an info window on the map; phones show a bottom card instead.
  popup: boolean;
  onSelect: (id: string | null) => void;
  onViewportChange: (v: Viewport) => void;
  onMapReady: (map: google.maps.Map) => void;
}) {
  const t = useTranslations('map');
  const loc = selectedGear?.location;
  return (
    <GoogleMapShell
      className="map-canvas"
      label={t('region')}
      defaultCenter={{ lat: view.center[0], lng: view.center[1] }}
      defaultZoom={view.zoom}
      minZoom={MIN_ZOOM}
      maxZoom={MAX_ZOOM}
    >
      <MapBridge onReady={onMapReady} />
      <ViewportTracker onChange={onViewportChange} />
      {radius && (
        <Circle
          center={{ lat: radius.center[0], lng: radius.center[1] }}
          radius={radius.km * 1000}
          clickable={false}
          strokeColor="#205a28"
          strokeWeight={2}
          fillColor="#3a7d45"
          fillOpacity={0.1}
        />
      )}
      <ClusterLayer
        items={items}
        selectedId={selectedGear?.id ?? null}
        focus={focus}
        onSelect={onSelect}
      />
      {popup && selectedGear && loc && (
        <InfoWindow
          position={{ lng: loc[0], lat: loc[1] }}
          pixelOffset={[0, -44]}
          onCloseClick={() => onSelect(null)}
        >
          <GearPopup gear={selectedGear} />
        </InfoWindow>
      )}
    </GoogleMapShell>
  );
}
