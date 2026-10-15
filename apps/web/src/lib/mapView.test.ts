import { describe, expect, it } from 'vitest';
import {
  FINLAND_VIEW,
  carryFilterParams,
  formatBbox,
  formatMapView,
  initialView,
  isCapped,
  parseMapView,
  toMapQuery,
  zoomForRadius,
} from './mapView';

describe('parseMapView', () => {
  it('parses a valid view', () => {
    expect(parseMapView({ center: '60.17,24.94', zoom: '9' })).toEqual({
      center: [60.17, 24.94],
      zoom: 9,
    });
  });

  it.each([
    [{}],
    [{ center: '60.17,24.94' }],
    [{ zoom: '9' }],
    [{ center: 'abc,def', zoom: '9' }],
    [{ center: '95,24', zoom: '9' }],
    [{ center: '60,200', zoom: '9' }],
    [{ center: '60,24,3', zoom: '9' }],
    [{ center: '60', zoom: '9' }],
    [{ center: '60,24', zoom: '2' }],
    [{ center: '60,24', zoom: '19' }],
    [{ center: '60,24', zoom: '9.5' }],
  ])('ignores invalid input %j', (sp) => {
    expect(parseMapView(sp)).toBeUndefined();
  });

  it('round-trips through formatMapView', () => {
    const view = { center: [60.17, 24.94] as [number, number], zoom: 9 };
    expect(parseMapView(formatMapView(view))).toEqual(view);
  });
});

describe('initialView', () => {
  it('prefers the URL view', () => {
    const view = { center: [61, 25] as [number, number], zoom: 8 };
    expect(initialView(view, { lat: 60, lng: 24, radiusKm: 10 })).toEqual(view);
  });

  it('centres on the distance-filter point when there is no URL view', () => {
    const v = initialView(undefined, { lat: 60.17, lng: 24.94, radiusKm: 25 });
    expect(v.center).toEqual([60.17, 24.94]);
    expect(v.zoom).toBe(zoomForRadius(25, 60.17));
  });

  it('falls back to Finland', () => {
    expect(initialView(undefined, {})).toEqual(FINLAND_VIEW);
    expect(initialView(undefined, { lat: 60, lng: 24 })).toEqual(FINLAND_VIEW);
  });

  it('zooms in more for smaller radii', () => {
    expect(zoomForRadius(5, 60)).toBeGreaterThan(zoomForRadius(100, 60));
  });
});

describe('formatBbox', () => {
  it('formats west,south,east,north', () => {
    expect(formatBbox(24.1, 60.1, 25.2, 60.3)).toBe('24.10000,60.10000,25.20000,60.30000');
  });

  it('clamps a zoomed-out world map into the valid range', () => {
    expect(formatBbox(-540, -120, 540, 120)).toBe('-180.00000,-90.00000,180.00000,90.00000');
  });
});

describe('toMapQuery', () => {
  it('adds bbox and the cap, keeps filters, drops the page', () => {
    const q = toMapQuery({ category: 'ski', q: 'rossi', page: 3, limit: 20 }, '1,2,3,4');
    expect(q).toEqual({ category: 'ski', q: 'rossi', bbox: '1,2,3,4', limit: 50 });
    expect('page' in q).toBe(false);
  });

  it('does not mutate the input', () => {
    const filters = { page: 2 };
    toMapQuery(filters, '1,2,3,4');
    expect(filters).toEqual({ page: 2 });
  });
});

describe('isCapped', () => {
  it('is true only when more results exist than were returned', () => {
    expect(isCapped(51, 50)).toBe(true);
    expect(isCapped(50, 50)).toBe(false);
    expect(isCapped(0, 0)).toBe(false);
  });
});

describe('carryFilterParams', () => {
  it('keeps filters and drops page, center and zoom', () => {
    expect(carryFilterParams('category=ski&q=a+b&page=2&center=60,24&zoom=9')).toBe(
      '?category=ski&q=a+b',
    );
  });

  it('returns an empty string when nothing is left', () => {
    expect(carryFilterParams('center=60,24&zoom=9')).toBe('');
    expect(carryFilterParams('')).toBe('');
  });

  it('carries the distance filter point', () => {
    expect(carryFilterParams(new URLSearchParams('lat=60&lng=24&radiusKm=10'))).toBe(
      '?lat=60&lng=24&radiusKm=10',
    );
  });
});
