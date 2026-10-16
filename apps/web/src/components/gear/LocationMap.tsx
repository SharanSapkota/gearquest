'use client';

import { AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';
import { GoogleMapShell } from '@/components/map/GoogleMapShell';

export type LngLat = { lng: number; lat: number };

const FINLAND_CENTER = { lat: 64.5, lng: 26.5 };
const FINLAND_ZOOM = 5;
const PLACED_ZOOM = 13;

function PickerLayer({
  position,
  focusKey,
  onChange,
}: {
  position: LngLat | null;
  focusKey: number;
  onChange: (p: LngLat) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) onChange({ lng: e.latLng.lng(), lat: e.latLng.lat() });
    });
    return () => listener.remove();
  }, [map, onChange]);

  // Re-centres only when focusKey changes (e.g. "Use my location"), not on every drag.
  useEffect(() => {
    if (!map || focusKey === 0 || !position) return;
    map.setCenter({ lat: position.lat, lng: position.lng });
    map.setZoom(Math.max(map.getZoom() ?? 0, PLACED_ZOOM));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, map]);

  if (!position) return null;
  return (
    <AdvancedMarker
      position={{ lat: position.lat, lng: position.lng }}
      draggable
      onDragEnd={(e) => {
        if (e.latLng) onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      }}
    />
  );
}

export default function LocationMap({
  position,
  focusKey,
  onChange,
  label,
}: {
  position: LngLat | null;
  focusKey: number;
  onChange: (p: LngLat) => void;
  label: string;
}) {
  return (
    <GoogleMapShell
      className="location-map"
      label={label}
      defaultCenter={position ? { lat: position.lat, lng: position.lng } : FINLAND_CENTER}
      defaultZoom={position ? PLACED_ZOOM : FINLAND_ZOOM}
      gestureHandling="cooperative"
    >
      <PickerLayer position={position} focusKey={focusKey} onChange={onChange} />
    </GoogleMapShell>
  );
}
