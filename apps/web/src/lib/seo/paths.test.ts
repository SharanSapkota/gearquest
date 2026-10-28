import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { idSlug, pageAlternates, parseIdSlug, publicPath, slugify } from './paths';
import { finnishLegacyRedirects, finnishRewrites } from './routes';

const ID = '66f1a2b3c4d5e6f708192a3b';

beforeEach(() => vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.test/'));
afterEach(() => vi.unstubAllEnvs());

describe('slugify', () => {
  it('folds Nordic diacritics and punctuation', () => {
    expect(slugify('Pyörä – Åre Ski & Co!')).toBe('pyora-are-ski-co');
  });
  it('caps length without a trailing dash', () => {
    expect(slugify('a'.repeat(59) + ' bbb')).toBe('a'.repeat(59));
  });
});

describe('id-slug', () => {
  it('builds and parses', () => {
    expect(idSlug(ID, 'Lumilauta Burton')).toBe(`${ID}-lumilauta-burton`);
    expect(parseIdSlug(`${ID}-old-slug`)).toEqual({ id: ID, hasSlugForm: true });
    expect(parseIdSlug(ID)).toEqual({ id: ID, hasSlugForm: true });
  });
  it('leaves non-ObjectId ids alone', () => {
    expect(parseIdSlug('mock-1')).toEqual({ id: 'mock-1', hasSlugForm: false });
    expect(parseIdSlug('%E0%A4%A')).toEqual({ id: '%E0%A4%A', hasSlugForm: false });
  });
  it('falls back to the bare id for an unsluggable title', () => {
    expect(idSlug(ID, '!!!')).toBe(ID);
  });
});

describe('alternates', () => {
  it('points each locale at its own localized URL, canonical is the current locale', () => {
    const a = pageAlternates('gear', 'fi', { id: `${ID}-pulkka` });
    expect(a.canonical).toBe(`https://example.test/fi/varuste/${ID}-pulkka`);
    expect(a.languages).toEqual({
      fi: `https://example.test/fi/varuste/${ID}-pulkka`,
      en: `https://example.test/en/gear/${ID}-pulkka`,
      'x-default': `https://example.test/fi/varuste/${ID}-pulkka`,
    });
    expect(pageAlternates('terms', 'en').canonical).toBe('https://example.test/en/terms');
    expect(pageAlternates('terms', 'en').languages.fi).toBe('https://example.test/fi/ehdot');
  });
  it('home has no trailing slash', () => {
    expect(publicPath('home', 'en')).toBe('/en');
  });
});

describe('next.config route tables', () => {
  it('rewrites Finnish paths to the internal English routes', () => {
    expect(finnishRewrites()).toContainEqual({ source: '/fi/varuste/:id', destination: '/fi/gear/:id' });
    expect(finnishRewrites()).toContainEqual({ source: '/fi/ehdot', destination: '/fi/terms' });
  });
  it('redirects old Finnish URLs but never /gear/new or /gear/mine', () => {
    const gear = finnishLegacyRedirects().find((r) => r.destination === '/fi/varuste/:id');
    expect(gear?.permanent).toBe(true);
    const re = new RegExp(`^${gear!.source.replace('/fi/gear/:id(', '/fi/gear/(').replace(/\)$/, ')')}$`);
    expect(re.test(`/fi/gear/${ID}`)).toBe(true);
    expect(re.test(`/fi/gear/${ID}-slug`)).toBe(true);
    expect(re.test('/fi/gear/new')).toBe(false);
    expect(re.test('/fi/gear/mine')).toBe(false);
    expect(re.test(`/fi/gear/${ID}/edit`)).toBe(false);
  });
});
