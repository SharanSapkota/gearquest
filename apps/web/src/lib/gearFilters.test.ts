import { describe, expect, it } from 'vitest';
import { api } from './api';
import { buildSearch, pageWindow, parseGearSearchParams } from './gearFilters';
import { filterMockGear } from './mockGear';

describe('parseGearSearchParams', () => {
  it('converts EUR prices to cents and dates to Helsinki-day UTC instants', () => {
    const q = parseGearSearchParams({
      minPrice: '10.5',
      maxPrice: '40',
      from: '2026-01-15',
      to: '2026-01-16',
      category: 'ski',
    });
    expect(q.minPriceCents).toBe(1050);
    expect(q.maxPriceCents).toBe(4000);
    expect(q.from).toBe('2026-01-14T22:00:00.000Z');
    expect(q.to).toBe('2026-01-16T22:00:00.000Z');
    expect(q.category).toBe('ski');
  });

  it('uses UTC+3 in summer', () => {
    expect(parseGearSearchParams({ from: '2026-07-01' }).from).toBe('2026-06-30T21:00:00.000Z');
  });

  it('drops invalid values instead of failing', () => {
    const q = parseGearSearchParams({ category: 'boat', sort: 'nope', page: '0', from: 'x' });
    expect(q.category).toBeUndefined();
    expect(q.sort).toBeUndefined();
    expect(q.page).toBeUndefined();
    expect(q.from).toBeUndefined();
  });

  it('drops an incomplete geo group and an inverted price range', () => {
    expect(parseGearSearchParams({ lat: '60', lng: '24' })).not.toHaveProperty('lat');
    const q = parseGearSearchParams({ minPrice: '50', maxPrice: '10' });
    expect(q.maxPriceCents).toBeUndefined();
  });
});

describe('buildSearch / pageWindow', () => {
  it('applies overrides and removes empty values', () => {
    expect(buildSearch({ q: 'ski', page: '3' }, { page: '4', q: '' })).toBe('?page=4');
    expect(buildSearch({})).toBe('');
  });
  it('keeps the window inside the page range', () => {
    expect(pageWindow(1, 10)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(10, 10)).toEqual([6, 7, 8, 9, 10]);
    expect(pageWindow(1, 2)).toEqual([1, 2]);
  });
});

describe('mock fallback', () => {
  it('filters and sorts by price', () => {
    const r = filterMockGear({ category: 'ski' });
    expect(r.items.map((g) => g.category)).toEqual(['ski']);
    const sorted = filterMockGear({ sort: 'priceDesc', mode: 'daily' });
    expect(sorted.items[0]?.pricing.dailyCents).toBe(6000);
  });
  it('is used only when the API is unreachable', async () => {
    const orig = globalThis.fetch;
    globalThis.fetch = (() => Promise.reject(new TypeError('fetch failed'))) as typeof fetch;
    try {
      expect((await api.listGear()).items.length).toBeGreaterThan(0);
      globalThis.fetch = (() => Promise.resolve(new Response('', { status: 500 }))) as typeof fetch;
      await expect(api.listGear()).rejects.toThrow('api.500');
    } finally {
      globalThis.fetch = orig;
    }
  });
});
