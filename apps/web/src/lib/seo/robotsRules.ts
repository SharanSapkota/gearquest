import type { MetadataRoute } from 'next';
import { absoluteUrl, isIndexable } from '../siteUrl';
import { disallowRules, SEARCH_CRAWLERS, TRAINING_CRAWLERS, TRAINING_POLICY } from './crawlers';

export function buildRobots(trainingPolicy: 'allow' | 'disallow' = TRAINING_POLICY): MetadataRoute.Robots {
  // Non-production (or no public URL configured): keep every crawler out.
  if (!isIndexable()) return { rules: { userAgent: '*', disallow: '/' } };
  const disallow = disallowRules();
  // A crawler with its own group ignores the "*" group, so the private-path rules are repeated.
  return {
    rules: [
      { userAgent: SEARCH_CRAWLERS, allow: '/', disallow },
      trainingPolicy === 'allow'
        ? { userAgent: TRAINING_CRAWLERS, allow: '/', disallow }
        : { userAgent: TRAINING_CRAWLERS, disallow: '/' },
      { userAgent: '*', allow: '/', disallow },
    ],
    sitemap: absoluteUrl('/sitemap-index.xml'),
  };
}
