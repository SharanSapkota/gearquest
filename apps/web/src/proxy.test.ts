import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const intl = vi.fn(() => new Response('intl'));
vi.mock('next-intl/middleware', () => ({ default: () => intl }));
const fetchGearStatus = vi.fn();
vi.mock('./lib/api', () => ({ fetchGearStatus }));
vi.mock('./i18n/routing', () => ({ routing: {} }));

const { default: proxy } = await import('./proxy');
const ID = '66f1a2b3c4d5e6f708192a3b';
const req = (path: string) => new NextRequest(`https://example.test${path}`);

beforeEach(() => {
  intl.mockClear();
  fetchGearStatus.mockReset();
});

describe('proxy: removed gear', () => {
  it('answers 410 with the gone page for deleted gear, in both locales', async () => {
    fetchGearStatus.mockResolvedValue(410);
    for (const path of [`/fi/varuste/${ID}-pulkka`, `/en/gear/${ID}`]) {
      const res = await proxy(req(path));
      expect(res.status, path).toBe(410);
      expect(res.headers.get('x-middleware-rewrite')).toContain(`/${path.slice(1, 3)}/gone`);
    }
    expect(intl).not.toHaveBeenCalled();
  });

  it('lets 200, 404 and API failures through to the page', async () => {
    for (const status of [200, 404, null]) {
      fetchGearStatus.mockResolvedValue(status);
      await proxy(req(`/fi/varuste/${ID}`));
    }
    expect(intl).toHaveBeenCalledTimes(3);
  });

  it('only checks gear detail URLs (not edit, lists or other pages)', async () => {
    for (const path of [`/fi/gear/${ID}/edit`, '/fi/gear/new', '/fi', '/en/terms']) await proxy(req(path));
    expect(fetchGearStatus).not.toHaveBeenCalled();
  });

  it('forwards the session cookie so the owner keeps access', async () => {
    fetchGearStatus.mockResolvedValue(200);
    await proxy(new NextRequest(`https://example.test/fi/varuste/${ID}`, { headers: { cookie: 'sid=1' } }));
    expect(fetchGearStatus).toHaveBeenCalledWith(ID, 'sid=1');
  });
});
