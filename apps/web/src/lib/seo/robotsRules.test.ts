import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SEARCH_CRAWLERS, TRAINING_CRAWLERS } from './crawlers';
import { buildRobots } from './robotsRules';

type Rule = { userAgent?: string | string[]; allow?: string | string[]; disallow?: string | string[] };
const rules = (r: ReturnType<typeof buildRobots>) => (Array.isArray(r.rules) ? r.rules : [r.rules]) as Rule[];
const forAgent = (r: ReturnType<typeof buildRobots>, agent: string) =>
  rules(r).find((x) => [x.userAgent].flat().includes(agent));

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.test');
});
afterEach(() => vi.unstubAllEnvs());

describe('robots', () => {
  it('explicitly allows every search and assistant crawler', () => {
    for (const bot of SEARCH_CRAWLERS) {
      expect(forAgent(buildRobots(), bot)?.allow, bot).toBe('/');
    }
    expect(SEARCH_CRAWLERS).toEqual(
      expect.arrayContaining(['OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User', 'Claude-SearchBot', 'Claude-User', 'Googlebot', 'Bingbot', 'Applebot']),
    );
  });

  it('disallows private paths and duplicate-creating params for every group', () => {
    for (const group of rules(buildRobots())) {
      const d = [group.disallow].flat();
      for (const p of ['/api/', '/*/dashboard', '/*/rentals', '/*/profile', '/*/login', '/*/signup', '/*/become-owner', '/*/gear/new', '/*/gear/mine', '/*/gear/*/edit', '/*?sort=', '/*&page=', '/*?category=']) {
        expect(d, `${group.userAgent}: ${p}`).toContain(p);
      }
    }
  });

  it('follows the single training policy switch', () => {
    for (const bot of TRAINING_CRAWLERS) {
      expect(forAgent(buildRobots('allow'), bot)?.allow).toBe('/');
      expect(forAgent(buildRobots('disallow'), bot)?.disallow).toBe('/');
    }
    // Search crawlers are unaffected by the training switch.
    expect(forAgent(buildRobots('disallow'), 'OAI-SearchBot')?.allow).toBe('/');
  });

  it('references the sitemap index', () => {
    expect(buildRobots().sitemap).toBe('https://example.test/sitemap-index.xml');
  });

  it('blocks everything outside an indexable production deployment', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(buildRobots().rules).toEqual({ userAgent: '*', disallow: '/' });
    expect(buildRobots().sitemap).toBeUndefined();
  });
});
