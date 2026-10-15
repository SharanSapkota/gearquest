'use client';

import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';

export type LngLat = { lng: number; lat: number };

const FINLAND_CENTER: [number, number] = [64.5, 26.5];
const FINLAND_ZOOM = 5;

const icon = L.icon({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerIcon2x.src,
  shadowUrl: markerShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

function ClickToPlace({ onChange }: { onChange: (p: LngLat) => void }) {
  useMapEvents({ click: (e) => onChange({ lng: e.latlng.lng, lat: e.latlng.lat }) });
  return null;
}

// Re-centres only when focusKey changes (e.g. "Use my location"), not on every drag.
function FlyTo({ position, focusKey }: { position: LngLat | null; focusKey: number }) {
  const map = useMap();
  useEffect(() => {
    if (focusKey > 0 && position) map.setView([position.lat, position.lng], Math.max(map.getZoom(), 13));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);
  return null;
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
    <MapContainer
      center={position ? [position.lat, position.lng] : FINLAND_CENTER}
      zoom={position ? 13 : FINLAND_ZOOM}
      className="location-map"
      aria-label={label}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickToPlace onChange={onChange} />
      <FlyTo position={position} focusKey={focusKey} />
      {position && (
        <Marker
          position={[position.lat, position.lng]}
          icon={icon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const { lat, lng } = (e.target as L.Marker).getLatLng();
              onChange({ lat, lng });
            },
          }}
        />
      )}
    </MapContainer>
  );
}
