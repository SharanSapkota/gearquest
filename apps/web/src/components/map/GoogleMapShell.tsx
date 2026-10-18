'use client';

import {
  APILoadingStatus,
  APIProvider,
  Map,
  useApiLoadingStatus,
  type MapProps,
} from '@vis.gl/react-google-maps';
import { useLocale } from 'next-intl';
import type { ReactNode } from 'react';
import { MapUnavailable } from './MapUnavailable';

// The one place that reads the Google Maps key. Every map in the app renders through this
// component, so the script is requested once and the key never appears anywhere else.
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY || '';
// Advanced markers need a map ID. DEMO_MAP_ID is Google's development ID (default styling);
// set NEXT_PUBLIC_GOOGLE_MAP_ID to use the muted GearShare style (see apps/web/map-style.json).
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || 'google-map-script';
const LIBRARIES = ['marker'];

type ShellProps = Partial<
  Pick<MapProps, 'defaultCenter' | 'defaultZoom' | 'minZoom' | 'maxZoom' | 'gestureHandling'>
> & {
  className?: string;
  label: string;
  children?: ReactNode;
};

function MapOrFallback({
  className,
  label,
  children,
  gestureHandling = 'greedy',
  ...options
}: ShellProps) {
  const status = useApiLoadingStatus();
  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return <MapUnavailable reason="failed" />;
  }
  return (
    <div className={className} role="region" aria-label={label}>
      <Map
        mapId={MAP_ID}
        disableDefaultUI
        clickableIcons={false}
        keyboardShortcuts
        gestureHandling={gestureHandling}
        style={{ width: '100%', height: '100%' }}
        {...options}
      >
        {children}
      </Map>
    </div>
  );
}

export function GoogleMapShell(props: ShellProps) {
  const locale = useLocale();
  if (!API_KEY) return <MapUnavailable reason="missingKey" />;
  return (
    <APIProvider apiKey={API_KEY} language={locale} libraries={LIBRARIES}>
      <MapOrFallback {...props} />
    </APIProvider>
  );
}
