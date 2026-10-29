import { DISALLOWED_QUERY_PARAMS } from './crawlers';

type SearchParams = Record<string, string | string[] | undefined>;

const has = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v)?.trim() !== undefined && (Array.isArray(v) ? v[0] : v)?.trim() !== '';

// A listing URL is "filtered" when any filter, sort or map-view param is set. Those never get
// indexed (canonical is the clean URL). A bare ?page=N is a real page of the clean listing.
export function listingState(sp: SearchParams): { page: number; filtered: boolean } {
  const filtered = DISALLOWED_QUERY_PARAMS.filter((k) => k !== 'page').some((k) => has(sp[k]));
  const raw = Number(Array.isArray(sp.page) ? sp.page[0] : sp.page);
  const page = Number.isInteger(raw) && raw > 1 ? raw : 1;
  return { page, filtered };
}
