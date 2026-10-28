// Crawler policy for robots.txt. Edit here only.

// TRAINING crawlers collect content for model training. Change to 'disallow' to opt out of
// training without affecting search or assistant visibility. Currently allowed on purpose.
export const TRAINING_POLICY: 'allow' | 'disallow' = 'allow';
export const TRAINING_CRAWLERS = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'CCBot'];

// SEARCH and ASSISTANT crawlers (they fetch pages to answer a user or build a search index).
// Always allowed, independent of TRAINING_POLICY.
export const SEARCH_CRAWLERS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'Perplexity-User',
  'Claude-SearchBot',
  'Claude-User',
  'Googlebot',
  'Bingbot',
  'Applebot',
];

// Private or transactional paths (locale-prefixed, hence the wildcard) never crawled.
export const DISALLOWED_PATHS = [
  '/api/',
  '/*/dashboard',
  '/*/rentals',
  '/*/profile',
  '/*/login',
  '/*/signup',
  '/*/become-owner',
  '/*/gear/new',
  '/*/gear/mine',
  '/*/gear/*/edit',
];

// Filter, sort, pagination and map-view params create endless duplicate URLs. Matches the
// param at any position in the query string.
export const DISALLOWED_QUERY_PARAMS = [
  'q', 'category', 'condition', 'mode', 'minPrice', 'maxPrice', 'from', 'to', 'lat', 'lng',
  'radiusKm', 'bbox', 'minOwnerRating', 'sort', 'page', 'center', 'zoom',
];

export const disallowRules = () => [
  ...DISALLOWED_PATHS,
  ...DISALLOWED_QUERY_PARAMS.flatMap((p) => [`/*?${p}=`, `/*&${p}=`]),
];
