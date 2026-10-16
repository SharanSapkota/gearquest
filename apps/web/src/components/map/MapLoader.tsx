'use client';

import dynamic from 'next/dynamic';

// The map is client-only and lazy: it stays out of the initial bundle of every other page.
export const GearMapLoader = dynamic(() => import('./GearMap'), {
  ssr: false,
  loading: () => <div className="map-canvas" aria-busy="true" />,
});
