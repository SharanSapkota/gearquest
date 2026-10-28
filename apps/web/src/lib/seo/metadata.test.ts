import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import en from '../../messages/en.json';
import fi from '../../messages/fi.json';
import { buildMetadata, DESCRIPTION_MAX, DESCRIPTION_MIN, environmentRobots, fitDescription, verificationMetadata } from './metadata';

beforeEach(() => vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.test'));
afterEach(() => vi.unstubAllEnvs());

describe('fitDescription', () => {
  it('stops once 120+ characters, never exceeds 160', () => {
    const a = 'First sentence that is a fairly long piece of copy about renting gear in Finland near you.';
    const out = fitDescription([a, 'Second sentence with more detail about the item.', 'Third should not be needed.']);
    expect(out.length).toBeGreaterThanOrEqual(DESCRIPTION_MIN);
    expect(out.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    expect(out).not.toContain('Third');
  });
  it('cuts at a word boundary with an ellipsis', () => {
    const out = fitDescription(['word '.repeat(60)]);
    expect(out.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    expect(out.endsWith('word…')).toBe(true);
  });
  it('skips empty parts', () => {
    expect(fitDescription([undefined, '  ', 'Hello'])).toBe('Hello');
  });
});

describe('static descriptions in both locales', () => {
  const entries = (m: Record<string, string>) => Object.entries(m).filter(([k]) => k.endsWith('Description'));
  it.each([
    ['fi', fi.seo],
    ['en', en.seo],
  ])('%s are 120-160 characters', (_l, seo) => {
    for (const [key, value] of entries(seo)) {
      expect(value.length, key).toBeGreaterThanOrEqual(DESCRIPTION_MIN);
      expect(value.length, key).toBeLessThanOrEqual(DESCRIPTION_MAX);
    }
  });
});

describe('buildMetadata', () => {
  const meta = () => buildMetadata({ locale: 'fi', page: 'terms', title: 'Ehdot', description: 'd' });
  it('sets canonical and hreflang to the equivalent pages', () => {
    const m = meta();
    expect(m.alternates?.canonical).toBe('https://example.test/fi/ehdot');
    expect(m.alternates?.languages).toMatchObject({
      fi: 'https://example.test/fi/ehdot',
      en: 'https://example.test/en/terms',
      'x-default': 'https://example.test/fi/ehdot',
    });
  });
  it('sets Open Graph locale, alternate locale and Twitter large card', () => {
    const m = meta();
    expect(m.openGraph).toMatchObject({ locale: 'fi_FI', alternateLocale: ['en_GB'], url: 'https://example.test/fi/ehdot' });
    expect(m.twitter).toMatchObject({ card: 'summary_large_image' });
  });
  it('uses the English og:locale for en', () => {
    const en = buildMetadata({ locale: 'en', page: 'terms', title: 'Terms', description: 'd' });
    expect(en.openGraph).toMatchObject({ locale: 'en_GB', alternateLocale: ['fi_FI'] });
  });
});

describe('environment rules', () => {
  it('is noindex outside production or without a site URL', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(environmentRobots()).toEqual({ index: false, follow: false });
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    expect(environmentRobots()).toEqual({ index: false, follow: false });
  });
  it('is indexable in production with a site URL', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(environmentRobots()).toBeUndefined();
  });
  it('renders verification tags only when set', () => {
    vi.stubEnv('NEXT_PUBLIC_GSC_VERIFICATION', '');
    vi.stubEnv('NEXT_PUBLIC_BING_VERIFICATION', '');
    expect(verificationMetadata()).toBeUndefined();
    vi.stubEnv('NEXT_PUBLIC_GSC_VERIFICATION', 'g123');
    vi.stubEnv('NEXT_PUBLIC_BING_VERIFICATION', 'b456');
    expect(verificationMetadata()).toEqual({ google: 'g123', other: { 'msvalidate.01': 'b456' } });
  });
});
