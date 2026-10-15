'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type GearQuery, type PublicGear } from '@/lib/api';
import { formatMapView, isCapped, toMapQuery, type MapView } from '@/lib/mapView';
import type { Viewport } from './GearMap';
import { Legend } from './Legend';
import { GearMapLoader } from './MapLoader';

const DEBOUNCE_MS = 300;

type Result =
  | { status: 'loading' | 'error'; items: PublicGear[]; total: number }
  | { status: 'ready'; items: PublicGear[]; total: number };

// Owns the data flow of the map page: viewport -> debounced fetch (stale ones aborted) -> markers.
export function MapExperience({ filters, view }: { filters: GearQuery; view: MapView }) {
  const t = useTranslations('map');
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [result, setResult] = useState<Result>({ status: 'loading', items: [], total: 0 });
  const [attempt, setAttempt] = useState(0);
  const reported = useRef(false);

  const onViewportChange = useCallback((v: Viewport) => {
    setViewport(v);
    // The first report is the initial view; only later moves rewrite the URL. replaceState keeps
    // the server page from re-rendering on every pan.
    if (!reported.current) {
      reported.current = true;
      return;
    }
    const { center, zoom } = formatMapView({ center: v.center, zoom: v.zoom });
    const url = new URL(window.location.href);
    url.searchParams.set('center', center);
    url.searchParams.set('zoom', zoom);
    window.history.replaceState(null, '', url);
  }, []);

  useEffect(() => {
    if (!viewport) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setResult((r) => ({ ...r, status: 'loading' }));
      try {
        const res = await api.listGear(toMapQuery(filters, viewport.bbox), controller.signal);
        if (controller.signal.aborted) return;
        setResult({ status: 'ready', items: res.items, total: res.total });
      } catch {
        if (controller.signal.aborted) return;
        setResult((r) => ({ ...r, status: 'error' }));
      }
    }, DEBOUNCE_MS);
    // A newer viewport/filter change cancels both the pending timer and the in-flight request,
    // so an old response can never overwrite a newer one.
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [viewport, filters, attempt]);

  const { lat, lng, radiusKm } = filters;
  const radius =
    lat !== undefined && lng !== undefined && radiusKm !== undefined
      ? { center: [lat, lng] as [number, number], km: radiusKm }
      : undefined;

  return (
    <section className="map-canvas" aria-label={t('region')}>
      <GearMapLoader
        view={view}
        items={result.items}
        radius={radius}
        onViewportChange={onViewportChange}
      />
      <div className="map-status">
        {result.status === 'loading' && (
          <p role="status" className="map-chip">
            {t('loading')}
          </p>
        )}
        {result.status === 'error' && (
          <p role="alert" className="map-chip map-chip--error">
            {t('error')}{' '}
            <button type="button" onClick={() => setAttempt((n) => n + 1)}>
              {t('retry')}
            </button>
          </p>
        )}
        {result.status === 'ready' && result.items.length === 0 && (
          <p role="status" className="map-chip">
            {t('empty')}
          </p>
        )}
        {result.status === 'ready' && isCapped(result.total, result.items.length) && (
          <p role="status" className="map-chip">
            {t('capped', { shown: result.items.length, total: result.total })}
          </p>
        )}
      </div>
      <Legend />
    </section>
  );
}
