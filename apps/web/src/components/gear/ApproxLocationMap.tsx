'use client';

import 'leaflet/dist/leaflet.css';
import { Circle, MapContainer, TileLayer } from 'react-leaflet';
import { MAP_LOCATION_OFFSET_METERS } from '@gearshare/shared';

// Static mini map: a circle around the already-fuzzed public location, not a pin.
export default function ApproxLocationMap({
  position,
  label,
}: {
  position: [number, number]; // [lng, lat]
  label: string;
}) {
  const center: [number, number] = [position[1], position[0]];
  return (
    <MapContainer
      center={center}
      zoom={14}
      className="location-map location-map--mini"
      aria-label={label}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Circle center={center} radius={MAP_LOCATION_OFFSET_METERS} />
    </MapContainer>
  );
}
