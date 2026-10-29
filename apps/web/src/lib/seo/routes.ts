// Public URL table. Internal routes (app/[locale]/...) use the English path; Finnish URLs are
// localized and mapped onto them by next.config.ts rewrites. Imported by next.config.ts, so
// keep this file free of path aliases and app imports.
export const LOCALE_LIST = ['fi', 'en'] as const;
export type SeoLocale = (typeof LOCALE_LIST)[number];

// The [locale] segment also matches stray paths such as /service-worker.js; metadata must tolerate them.
export const isSeoLocale = (value: string): value is SeoLocale => (LOCALE_LIST as readonly string[]).includes(value);

export type PageKey = 'home' | 'map' | 'terms' | 'privacy' | 'gear' | 'user';

export const PUBLIC_PATHS: Record<PageKey, Record<SeoLocale, string>> = {
  home: { fi: '', en: '' },
  map: { fi: '/kartta', en: '/map' },
  terms: { fi: '/ehdot', en: '/terms' },
  privacy: { fi: '/tietosuoja', en: '/privacy' },
  gear: { fi: '/varuste/:id', en: '/gear/:id' },
  user: { fi: '/kayttajat/:id', en: '/users/:id' },
};

// Only 24-hex ids carry a slug; /gear/new and /gear/mine must not be treated as gear pages.
const ID_PATTERN = ':id([0-9a-fA-F]{24}[^/]*)';
const withIdPattern = (path: string) => path.replace(':id', ID_PATTERN);

// Finnish public path -> internal route (the English path).
export const finnishRewrites = () =>
  (Object.keys(PUBLIC_PATHS) as PageKey[])
    .filter((key) => PUBLIC_PATHS[key].fi !== PUBLIC_PATHS[key].en)
    .map((key) => ({
      source: `/fi${PUBLIC_PATHS[key].fi}`,
      destination: `/fi${PUBLIC_PATHS[key].en}`,
    }));

// Old English-style Finnish URLs -> the localized path (permanent).
export const finnishLegacyRedirects = () =>
  (Object.keys(PUBLIC_PATHS) as PageKey[])
    .filter((key) => PUBLIC_PATHS[key].fi !== PUBLIC_PATHS[key].en)
    .map((key) => ({
      source: `/fi${withIdPattern(PUBLIC_PATHS[key].en)}`,
      destination: `/fi${PUBLIC_PATHS[key].fi}`,
      permanent: true,
    }));
