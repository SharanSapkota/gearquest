import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }));
const { pageTitle } = await import('./metadata');

describe('private pages', () => {
  it('pageTitle (used by login, signup, dashboards, rentals, own gear, edit forms) is noindex,nofollow', async () => {
    const meta = await pageTitle('rentals.title')({ params: Promise.resolve({ locale: 'fi' }) });
    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(meta.title).toBe('title');
  });
});
