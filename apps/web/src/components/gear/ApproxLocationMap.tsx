'use client';

import { Circle } from '@vis.gl/react-google-maps';
import { MAP_LOCATION_OFFSET_METERS } from '@gearshare/shared';
import { GoogleMapShell } from '@/components/map/GoogleMapShell';

// Static mini map: a circle around the already-fuzzed public location, not a pin.
export default function ApproxLocationMap({
  position,
  label,
}: {
  position: [number, number]; // [lng, lat]
  label: string;
}) {
  const center = { lat: position[1], lng: position[0] };
  return (
    <GoogleMapShell
      className="location-map location-map--mini"
      label={label}
      defaultCenter={center}
      defaultZoom={14}
      gestureHandling="cooperative"
    >
      <Circle
        center={center}
        radius={MAP_LOCATION_OFFSET_METERS}
        clickable={false}
        strokeColor="#2f7d4f"
        strokeWeight={2}
        fillColor="#2f7d4f"
        fillOpacity={0.18}
      />
    </GoogleMapShell>
  );
}
