'use client';

import dynamic from 'next/dynamic';

// Leaflet touches `window`, so the map is client-only.
export const GearMapLoader = dynamic(() => import('./GearMap'), {
  ssr: false,
  loading: () => <div className="map-leaflet" aria-busy="true" />,
});
