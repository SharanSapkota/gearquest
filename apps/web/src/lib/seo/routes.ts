// Public URL table. Internal routes (app/[locale]/...) use the English path; Finnish URLs are
// localized and mapped onto them by next.config.ts rewrites. Imported by next.config.ts, so
// keep this file free of path aliases and app imports.
export const LOCALE_LIST = ['fi', 'en'] as const;
export type SeoLocale = (typeof LOCALE_LIST)[number];

// The [locale] segment also matches stray paths such as /service-worker.js; metadata must tolerate them.
export const isSeoLocale = (value: string): value is SeoLocale => (LOCALE_LIST as readonly string[]).includes(value);

export type PageKey =
  | 'home'
  | 'map'
  | 'terms'
  | 'privacy'
  | 'gear'
  | 'user'
  | 'category'
  | 'categoryCity'
  | 'city'
  | 'howItWorks'
  | 'forOwners'
  | 'forRenters'
  | 'safety'
  | 'faq'
  | 'about'
  | 'guides'
  | 'guide';

export const PUBLIC_PATHS: Record<PageKey, Record<SeoLocale, string>> = {
  home: { fi: '', en: '' },
  map: { fi: '/kartta', en: '/map' },
  terms: { fi: '/ehdot', en: '/terms' },
  privacy: { fi: '/tietosuoja', en: '/privacy' },
  gear: { fi: '/varuste/:id', en: '/gear/:id' },
  user: { fi: '/kayttajat/:id', en: '/users/:id' },
  category: { fi: '/varusteet/:category', en: '/gear/category/:category' },
  categoryCity: { fi: '/varusteet/:category/:city', en: '/gear/category/:category/:city' },
  city: { fi: '/kaupungit/:city', en: '/cities/:city' },
  howItWorks: { fi: '/miten-se-toimii', en: '/how-it-works' },
  forOwners: { fi: '/vuokraa-varusteesi', en: '/for-owners' },
  forRenters: { fi: '/vuokraajalle', en: '/for-renters' },
  safety: { fi: '/turvallisuus', en: '/safety' },
  faq: { fi: '/ukk', en: '/faq' },
  about: { fi: '/tietoa', en: '/about' },
  guides: { fi: '/oppaat', en: '/guides' },
  guide: { fi: '/oppaat/:slug', en: '/guides/:slug' },
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

// Private/transactional URLs: served with X-Robots-Tag noindex,nofollow (next.config.ts headers).
export const PRIVATE_HEADER_SOURCES = [
  '/:locale(fi|en)/:section(dashboard|rentals|profile|login|signup|become-owner)/:path*',
  '/:locale(fi|en)/:section(dashboard|rentals|profile|login|signup|become-owner)',
  '/:locale(fi|en)/gear/new',
  '/:locale(fi|en)/gear/mine',
  '/:locale(fi|en)/gear/:id/edit',
];
