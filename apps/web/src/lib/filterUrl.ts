import type { SearchParams } from './gearFilters';

// Each group is one filter in the badge ("min + max price" is one). `q` is not counted: it is
// shown in the search box itself.
const FILTER_GROUPS = [
  ['category'],
  ['condition'],
  ['mode'],
  ['minPrice', 'maxPrice'],
  ['from', 'to'],
  ['lat', 'lng', 'radiusKm'],
  ['minOwnerRating'],
  ['sort'],
];

const isSet = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() !== undefined
  && (Array.isArray(v) ? v[0] : v)?.trim() !== '';

export const countActiveFilters = (sp: SearchParams): number =>
  FILTER_GROUPS.filter((group) => group.some((key) => isSet(sp[key]))).length;

// Applies changes to a query string; `page` always resets because the result set changed.
export function withParams(
  current: URLSearchParams | string,
  changes: Record<string, string | undefined>,
): URLSearchParams {
  const params = new URLSearchParams(current);
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined || value === '') params.delete(key);
    else params.set(key, value);
  }
  params.delete('page');
  return params;
}
