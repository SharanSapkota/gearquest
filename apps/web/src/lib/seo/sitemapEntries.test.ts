import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { gearEntries, gearFileCount, localizedEntries, staticEntries } from './sitemapEntries';

const ID = '66f1a2b3c4d5e6f708192a3b';
const row = { id: ID, slug: 'pulkka', images: ['https://img.test/a.jpg'], updatedAt: '2026-03-01T10:00:00.000Z' };

beforeEach(() => vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.test'));
afterEach(() => vi.unstubAllEnvs());

describe('sitemap entries', () => {
  it('lists every gear in both locales with hreflang alternates, lastmod and images', () => {
    const entries = gearEntries([row]);
    expect(entries.map((e) => e.url)).toEqual([
      `https://example.test/fi/varuste/${ID}-pulkka`,
      `https://example.test/en/gear/${ID}-pulkka`,
    ]);
    for (const e of entries) {
      expect(e.alternates?.languages).toEqual({
        fi: `https://example.test/fi/varuste/${ID}-pulkka`,
        en: `https://example.test/en/gear/${ID}-pulkka`,
        'x-default': `https://example.test/fi/varuste/${ID}-pulkka`,
      });
      expect(e.lastModified).toEqual(new Date('2026-03-01T10:00:00.000Z'));
      expect(e.images).toEqual(['https://img.test/a.jpg']);
    }
  });

  it('omits the images key when there are no photos and uses the bare id without a slug', () => {
    const [fi] = gearEntries([{ ...row, slug: '', images: [] }]);
    expect(fi?.url).toBe(`https://example.test/fi/varuste/${ID}`);
    expect(fi).not.toHaveProperty('images');
  });

  it('static pages exist in both locales and never carry a made-up lastmod', () => {
    const entries = staticEntries();
    expect(entries.map((e) => e.url)).toContain('https://example.test/fi/ehdot');
    expect(entries.map((e) => e.url)).toContain('https://example.test/en/terms');
    expect(entries.every((e) => e.lastModified === undefined)).toBe(true);
  });

  it('splits gear into files of 2,500 (5,000 URLs)', () => {
    expect(gearFileCount(0)).toBe(0);
    expect(gearFileCount(2500)).toBe(1);
    expect(gearFileCount(2501)).toBe(2);
    expect(gearEntries(Array.from({ length: 2500 }, () => row))).toHaveLength(5000);
  });

  it('contains no private data', () => {
    const json = JSON.stringify([...staticEntries(), ...gearEntries([row]), ...localizedEntries('terms')]);
    expect(json).not.toMatch(/phone|email|googleId|@|\+358|coordinates|exactLocation/i);
  });
});
