// Post-login destinations come from the URL (?next=), so only same-site relative paths are
// allowed. Anything else (other origins, protocol-relative //host, /\host, javascript:, control
// characters) falls back to the given default. Paths are locale-less (e.g. /gear/123).
export function safeRedirect(next: string | null | undefined, fallback = '/'): string {
  if (typeof next !== 'string' || next.length === 0 || next.length > 2048) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\\]/.test(next)) return fallback;
  if (!next.startsWith('/') || next.startsWith('//')) return fallback;
  // The URL parser is the final judge: the path must stay on our own origin.
  try {
    const base = 'http://gearshare.invalid';
    const url = new URL(next, base);
    if (url.origin !== base) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

// The current location as a ?next= value: path without the locale prefix, plus the query string.
export const nextParam = (pathname: string, search = '') =>
  encodeURIComponent(`${pathname}${search}`);
