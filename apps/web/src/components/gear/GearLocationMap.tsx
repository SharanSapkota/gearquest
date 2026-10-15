'use client';

import dynamic from 'next/dynamic';

// The map is client-only and lazy: it is not part of the initial bundle.
export const GearLocationMap = dynamic(() => import('./ApproxLocationMap'), {
  ssr: false,
  loading: () => <div className="location-map location-map--mini" aria-busy="true" />,
});
