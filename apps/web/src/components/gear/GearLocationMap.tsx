'use client';

import dynamic from 'next/dynamic';

// Leaflet touches `window`, so it is client-only.
export const GearLocationMap = dynamic(() => import('./ApproxLocationMap'), {
  ssr: false,
  loading: () => <div className="location-map location-map--mini" aria-busy="true" />,
});
