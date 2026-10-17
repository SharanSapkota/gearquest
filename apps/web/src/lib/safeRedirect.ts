import { LOCALES } from '@gearshare/shared';

const ORIGIN = 'http://gearshare.invalid';
const LOCALE_PREFIX = new RegExp(`^/(${LOCALES.join('|')})(?=/|$)`);

// Returns a same-site, locale-less path for redirects after sign-in, or the fallback. Only plain
// relative paths pass: no scheme, no protocol-relative "//", no backslashes, no control characters.
export function safeRedirect(target: unknown, fallback = '/'): string {
  const value = Array.isArray(target) ? target[0] : target;
  if (typeof value !== 'string' || !value.startsWith('/')) return fallback;
  const hasControlOrSpace = [...value].some((c) => c.charCodeAt(0) <= 0x20 || c.charCodeAt(0) === 0x7f);
  if (value.startsWith('//') || value.includes('\\') || hasControlOrSpace || /\s/.test(value)) {
    return fallback;
  }
  let url: URL;
  try {
    url = new URL(value, ORIGIN);
  } catch {
    return fallback;
  }
  if (url.origin !== ORIGIN) return fallback;
  // Navigation adds the active locale itself, so drop one that is already in the path.
  const pathname = url.pathname.replace(LOCALE_PREFIX, '') || '/';
  return `${pathname}${url.search}${url.hash}`;
}
