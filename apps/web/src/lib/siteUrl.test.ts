import { afterEach, describe, expect, it, vi } from 'vitest';
import { absoluteUrl, getSiteUrl } from './siteUrl';

afterEach(() => vi.unstubAllEnvs());

describe('siteUrl', () => {
  it('strips trailing slashes and builds absolute URLs', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://gearquest.example//');
    expect(getSiteUrl()).toBe('https://gearquest.example');
    expect(absoluteUrl('/fi')).toBe('https://gearquest.example/fi');
  });
  it('is undefined when unset and throws when invalid', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    expect(getSiteUrl()).toBeUndefined();
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'gearquest.example');
    expect(() => getSiteUrl()).toThrow(/invalid/);
  });
});
