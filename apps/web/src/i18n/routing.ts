import { defineRouting } from 'next-intl/routing';
import { DEFAULT_LOCALE, LOCALES } from '@gearquest/shared';

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  // Localized pathnames differ per locale, so the generated Link header would point at 404s.
  alternateLinks: false,
});
