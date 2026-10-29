import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listingState } from './listing';
import { buildMetadata } from './metadata';
import { pageAlternates } from './paths';

beforeEach(() => vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.test'));
afterEach(() => vi.unstubAllEnvs());

describe('listingState', () => {
  it('clean and unknown params are not filtered', () => {
    expect(listingState({})).toEqual({ page: 1, filtered: false });
    expect(listingState({ utm_source: 'x' })).toEqual({ page: 1, filtered: false });
  });
  it('any filter, sort or map-view param is filtered, empty values are not', () => {
    for (const k of ['q', 'category', 'sort', 'minPrice', 'from', 'lat', 'center', 'zoom']) {
      expect(listingState({ [k]: 'x' }).filtered, k).toBe(true);
    }
    expect(listingState({ q: '  ' }).filtered).toBe(false);
  });
  it('reads a valid page and ignores junk', () => {
    expect(listingState({ page: '3' })).toEqual({ page: 3, filtered: false });
    expect(listingState({ page: ['2', '9'] }).page).toBe(2);
    for (const bad of ['0', '-1', 'x', '1.5', '1']) expect(listingState({ page: bad }).page).toBe(1);
  });
});

describe('canonical for listings', () => {
  it('a paginated page is its own canonical, in every hreflang URL', () => {
    const a = pageAlternates('home', 'fi', {}, '?page=2');
    expect(a.canonical).toBe('https://example.test/fi?page=2');
    expect(a.languages).toEqual({
      fi: 'https://example.test/fi?page=2',
      en: 'https://example.test/en?page=2',
      'x-default': 'https://example.test/fi?page=2',
    });
  });
  it('a filtered URL canonicalizes to the clean URL and is noindex,follow', () => {
    const m = buildMetadata({ locale: 'en', page: 'home', title: 't', description: 'd', noindex: true });
    expect(m.alternates?.canonical).toBe('https://example.test/en');
    expect(m.robots).toEqual({ index: false, follow: true });
  });
});
