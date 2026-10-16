'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FilterControls } from '@/components/filters/FilterControls';
import { Button, IconButton } from '@/components/ui/Button';
import { ChevronUpIcon, CloseIcon, ListIcon } from '@/components/ui/icons';
import { api, type GearQuery, type PublicGear } from '@/lib/api';
import type { SearchParams } from '@/lib/gearFilters';
import { formatMapView, isCapped, toMapQuery, type MapView } from '@/lib/mapView';
import { useMediaQuery } from '@/lib/useMediaQuery';
import type { MapFocus } from './ClusterLayer';
import type { Viewport } from './GearMap';
import { GearMapCard } from './GearMapCard';
import { Legend } from './Legend';
import { MapControls } from './MapControls';
import { GearMapLoader } from './MapLoader';
import { ResultList } from './ResultList';

const DEBOUNCE_MS = 300;

type Result =
  | { status: 'loading' | 'error'; items: PublicGear[]; total: number }
  | { status: 'ready'; items: PublicGear[]; total: number };

// Owns the data flow of the map page: viewport -> debounced fetch (stale ones aborted) -> markers.
// Layout: full-bleed map with floating search/chips, controls, a side list (desktop) or a peek
// sheet (phones), and a bottom card for the tapped marker (phones).
export function MapExperience({
  filters,
  view,
  searchValues,
}: {
  filters: GearQuery;
  view: MapView;
  searchValues: SearchParams;
}) {
  const t = useTranslations('map');
  const desktop = useMediaQuery('(min-width: 768px)');
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [result, setResult] = useState<Result>({ status: 'loading', items: [], total: 0 });
  const [attempt, setAttempt] = useState(0);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [listOpen, setListOpen] = useState(false); // desktop side list
  const [peekOpen, setPeekOpen] = useState(false); // phone bottom sheet
  const reported = useRef(false);
  const focusCount = useRef(0);

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

  const selectedGear = useMemo(
    () => result.items.find((g) => g.id === selectedId) ?? null,
    [result.items, selectedId],
  );
  const count = result.items.length;

  const select = useCallback((id: string | null) => setSelectedId(id), []);
  const focusGear = (id: string) => {
    setSelectedId(id);
    setFocus({ id, n: ++focusCount.current });
    setPeekOpen(false);
  };

  // Before the first viewport report (e.g. the map could not load) there is nothing to count.
  const started = viewport !== null;
  const countLabel = started ? t('resultCount', { count: result.total }) : t('list');
  const list = <ResultList items={result.items} selectedId={selectedId} onFocus={focusGear} />;
  const showCard = !desktop && selectedGear !== null;

  const classes = ['mapx', showCard && 'mapx--card', desktop && listOpen && 'mapx--list-open']
    .filter(Boolean)
    .join(' ');

  return (
    <section className={classes} aria-label={t('region')}>
      <div className="mapx__map">
        <GearMapLoader
          view={view}
          items={result.items}
          radius={radius}
          selectedGear={selectedGear}
          focus={focus}
          popup={desktop}
          onSelect={select}
          onViewportChange={onViewportChange}
          onMapReady={setMap}
        />
      </div>

      <div className="mapx__top">
        <FilterControls basePath="/map" values={searchValues} preserve={['center', 'zoom']} />
        <div className="mapx__status">
          {started && result.status === 'loading' && (
            <p role="status" className="map-chip">
              {t('loading')}
            </p>
          )}
          {started && result.status === 'error' && (
            <p role="alert" className="map-chip map-chip--error">
              {t('error')}
              <Button variant="ghost" size="sm" onClick={() => setAttempt((n) => n + 1)}>
                {t('retry')}
              </Button>
            </p>
          )}
          {started && result.status === 'ready' && count === 0 && (
            <p role="status" className="map-chip">
              {t('empty')}
            </p>
          )}
          {result.status === 'ready' && isCapped(result.total, count) && (
            <p role="status" className="map-chip">
              {t('capped', { shown: count, total: result.total })}
            </p>
          )}
        </div>
      </div>

      <MapControls map={map} />
      <Legend />

      {/* Desktop: collapsible side list */}
      <div className={listOpen ? 'sidelist sidelist--open' : 'sidelist'}>
        <div className="sidelist__head">
          <h2>{countLabel}</h2>
          <IconButton label={t('hideList')} variant="ghost" onClick={() => setListOpen(false)}>
            <CloseIcon />
          </IconButton>
        </div>
        <div className="sidelist__body">{list}</div>
      </div>
      <Button
        variant="outline"
        className="list-toggle"
        aria-expanded={listOpen}
        onClick={() => setListOpen(true)}
      >
        <ListIcon size={18} />
        {t('list')}
      </Button>

      {/* Phones: bottom sheet with a peek state */}
      <div className={peekOpen ? 'peek peek--open' : 'peek'}>
        <button
          type="button"
          className="peek__handle"
          aria-expanded={peekOpen}
          onClick={() => setPeekOpen((o) => !o)}
        >
          <span>
            <ListIcon size={18} />
            {countLabel}
            <ChevronUpIcon
              size={18}
              style={{ transform: peekOpen ? 'rotate(180deg)' : undefined }}
            />
          </span>
        </button>
        {peekOpen && <div className="peek__body">{list}</div>}
      </div>

      {showCard && <GearMapCard gear={selectedGear} onClose={() => setSelectedId(null)} />}
    </section>
  );
}
