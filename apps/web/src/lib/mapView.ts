import { MAX_PAGE_SIZE } from '@gearshare/shared';
import type { GearQuery } from './api';
import type { SearchParams } from './gearFilters';

export type LatLng = [lat: number, lng: number];
export type MapView = { center: LatLng; zoom: number };

export const FINLAND_VIEW: MapView = { center: [64.5, 26.5], zoom: 5 };
export const MIN_ZOOM = 3;
export const MAX_ZOOM = 18;
export const MAP_RESULT_LIMIT = MAX_PAGE_SIZE;

// Params that belong to one tab only; they are not carried when switching Home <-> Map.
const TAB_ONLY_PARAMS = ['page', 'center', 'zoom'];

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim();
const inRange = (n: number, min: number, max: number) => Number.isFinite(n) && n >= min && n <= max;

// "center=60.17,24.94&zoom=9" -> view. Anything invalid is ignored so a hand-edited URL never breaks.
export function parseMapView(sp: SearchParams): MapView | undefined {
  const [lat, lng, extra] = (first(sp.center) ?? '').split(',').map(Number);
  const zoom = Number(first(sp.zoom));
  if (lat === undefined || lng === undefined || extra !== undefined) return undefined;
  if (!inRange(lat, -90, 90) || !inRange(lng, -180, 180)) return undefined;
  if (!Number.isInteger(zoom) || !inRange(zoom, MIN_ZOOM, MAX_ZOOM)) return undefined;
  return { center: [lat, lng], zoom };
}

export const formatMapView = ({ center, zoom }: MapView) => ({
  center: `${center[0].toFixed(5)},${center[1].toFixed(5)}`,
  zoom: String(Math.round(zoom)),
});

// Zoom at which a circle of the given radius fits comfortably on a typical screen.
export function zoomForRadius(radiusKm: number, lat: number) {
  const metersPerPixel = (radiusKm * 1000 * 2.4) / 600;
  const zoom = Math.log2((156543.03 * Math.cos((lat * Math.PI) / 180)) / metersPerPixel);
  return Math.min(14, Math.max(MIN_ZOOM + 1, Math.round(zoom)));
}

// URL view first, then the distance-filter point (so its circle is visible), then Finland.
export function initialView(
  view: MapView | undefined,
  filters: Pick<GearQuery, 'lat' | 'lng' | 'radiusKm'>,
): MapView {
  if (view) return view;
  const { lat, lng, radiusKm } = filters;
  if (lat !== undefined && lng !== undefined && radiusKm !== undefined) {
    return { center: [lat, lng], zoom: zoomForRadius(radiusKm, lat) };
  }
  return FINLAND_VIEW;
}

// "west,south,east,north", clamped because a zoomed-out map can extend past the valid range
// and the API rejects out-of-range boxes.
export function formatBbox(west: number, south: number, east: number, north: number) {
  const clamp = (n: number, limit: number) => Math.min(limit, Math.max(-limit, n));
  return [clamp(west, 180), clamp(south, 90), clamp(east, 180), clamp(north, 90)]
    .map((n) => n.toFixed(5))
    .join(',');
}

// Filters from the page plus the visible area. The map only ever shows the first page.
export function toMapQuery(filters: GearQuery, bbox: string): GearQuery {
  const rest = { ...filters };
  delete rest.page;
  return { ...rest, bbox, limit: MAP_RESULT_LIMIT };
}

export const isCapped = (total: number, shown: number) => total > shown;

// `?a=b` with every filter kept and the tab-only params removed.
export function carryFilterParams(search: string | URLSearchParams) {
  const params = new URLSearchParams(search);
  for (const key of TAB_ONLY_PARAMS) params.delete(key);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
