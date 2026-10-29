import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const redirect = vi.fn((to: string) => {
  throw new Error(`REDIRECT:${to}`);
});
const notFoundFn = vi.fn(() => {
  throw new Error('NOT_FOUND');
});
vi.mock('next/navigation', () => ({ permanentRedirect: redirect, notFound: notFoundFn }));
vi.mock('next-intl/server', () => ({ getTranslations: async () => (k: string) => k }));
const listGear = vi.fn();
vi.mock('../api', () => ({ api: { listGear } }));

const { resolveLanding, landingMetadata } = await import('./landingRoute');

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.test');
  redirect.mockClear();
  notFoundFn.mockClear();
  listGear.mockReset();
});
afterEach(() => vi.unstubAllEnvs());

describe('resolveLanding', () => {
  it('resolves canonical slugs', () => {
    const r = resolveLanding({ locale: 'fi', category: 'sukset', city: 'oulu' });
    expect(r).toMatchObject({ category: 'ski', page: 'categoryCity', pathParams: { category: 'sukset', city: 'oulu' } });
    expect(resolveLanding({ locale: 'en', city: 'levi' }).page).toBe('city');
  });
  it('404s on unknown category or city and on unknown locales', () => {
    expect(() => resolveLanding({ locale: 'fi', category: 'nope' })).toThrow('NOT_FOUND');
    expect(() => resolveLanding({ locale: 'fi', category: 'sukset', city: 'atlantis' })).toThrow('NOT_FOUND');
    expect(() => resolveLanding({ locale: 'xx', category: 'sukset' })).toThrow('NOT_FOUND');
  });
  it('redirects a slug from the other language to the canonical URL', () => {
    expect(() => resolveLanding({ locale: 'en', category: 'sukset', city: 'oulu' })).toThrow('REDIRECT:/en/gear/category/skis/oulu');
    expect(() => resolveLanding({ locale: 'fi', category: 'skis' })).toThrow('REDIRECT:/fi/varusteet/sukset');
  });
});

describe('landingMetadata', () => {
  const one = { id: '1', title: 'Skis', images: [], category: 'ski', city: 'Oulu', pricing: { dailyCents: 1500 } };

  it('is noindex when the page has no gear (thin content)', async () => {
    listGear.mockResolvedValue({ items: [], total: 0, page: 1, limit: 24 });
    const m = await landingMetadata({ locale: 'fi', category: 'sukset', city: 'oulu' }, {});
    expect(m.robots).toEqual({ index: false, follow: true });
  });

  it('is indexable with at least one listing, with canonical and hreflang to the other locale', async () => {
    listGear.mockResolvedValue({ items: [one], total: 1, page: 1, limit: 24 });
    const m = await landingMetadata({ locale: 'fi', category: 'sukset', city: 'oulu' }, {});
    expect(m.robots).toBeUndefined();
    expect(m.alternates?.canonical).toBe('https://example.test/fi/varusteet/sukset/oulu');
    expect(m.alternates?.languages).toMatchObject({
      fi: 'https://example.test/fi/varusteet/sukset/oulu',
      en: 'https://example.test/en/gear/category/skis/oulu',
    });
    expect(m.title).toBe('Vuokraa sukset Oulussa');
    expect(String(m.description).length).toBeGreaterThanOrEqual(120);
    expect(String(m.description).length).toBeLessThanOrEqual(160);
  });

  it('paginated pages are their own canonical; a page past the end is noindex', async () => {
    listGear.mockResolvedValue({ items: [one], total: 30, page: 2, limit: 24 });
    const m = await landingMetadata({ locale: 'en', category: 'skis' }, { page: '2' });
    expect(m.alternates?.canonical).toBe('https://example.test/en/gear/category/skis?page=2');
    listGear.mockResolvedValue({ items: [], total: 30, page: 9, limit: 24 });
    expect((await landingMetadata({ locale: 'en', category: 'skis' }, { page: '9' })).robots).toEqual({ index: false, follow: true });
  });

  it('queries the API with the normalized city key, never raw input', async () => {
    listGear.mockResolvedValue({ items: [one], total: 1, page: 1, limit: 24 });
    await landingMetadata({ locale: 'fi', category: 'sukset', city: 'jyvaskyla' }, {});
    expect(listGear).toHaveBeenCalledWith(expect.objectContaining({ category: 'ski', city: 'jyvaskyla' }));
  });
});
