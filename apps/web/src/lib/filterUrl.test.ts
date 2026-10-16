import { describe, expect, it } from 'vitest';
import { countActiveFilters, withParams } from './filterUrl';

describe('countActiveFilters', () => {
  it('is 0 for no filters and ignores the text search', () => {
    expect(countActiveFilters({})).toBe(0);
    expect(countActiveFilters({ q: 'tent', page: '2', center: '1,2', zoom: '5' })).toBe(0);
  });
  it('counts each filter group once', () => {
    expect(countActiveFilters({ category: 'ski', minPrice: '5', maxPrice: '20' })).toBe(2);
    expect(countActiveFilters({ from: '2026-01-01', to: '2026-01-03' })).toBe(1);
    expect(countActiveFilters({ lat: '60.1', lng: '24.9', radiusKm: '25', sort: 'newest' })).toBe(2);
  });
  it('ignores empty values', () => {
    expect(countActiveFilters({ category: '  ', condition: undefined })).toBe(0);
  });
});

describe('withParams', () => {
  it('sets, removes and resets the page while keeping other params', () => {
    const next = withParams('category=ski&page=3&center=60,24', { category: undefined, q: 'tent' });
    expect(next.get('q')).toBe('tent');
    expect(next.has('category')).toBe(false);
    expect(next.has('page')).toBe(false);
    expect(next.get('center')).toBe('60,24');
  });
});
