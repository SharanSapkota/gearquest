import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import en from '../../messages/en.json';
import fi from '../../messages/fi.json';
import { buildLlmsFullTxt, buildLlmsTxt } from './llms';

beforeEach(() => vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.test'));
afterEach(() => vi.unstubAllEnvs());

const rows = [
  { category: 'ski', city: 'Oulu' },
  { category: 'ski', city: 'Levi' },
  { category: 'tent', city: 'Oulu' },
];
const input = { rows, total: 3 };

describe('llms.txt', () => {
  const txt = () => buildLlmsTxt(input);

  it('describes GearQuest in English with a Finnish section, and the rental flow', () => {
    const t = txt();
    expect(t.startsWith('# GearQuest\n\n> GearQuest is a peer-to-peer adventure gear rental marketplace in Finland')).toBe(true);
    expect(t).toContain('# Suomeksi');
    expect(t).toContain('request -> owner approval -> contact via WhatsApp');
    expect(t).toContain('EUR');
    expect(t).toContain('3 active listings');
  });

  it('includes the intermediary disclaimer in both languages and the policies', () => {
    const t = txt();
    expect(t).toContain(en.legal.disclaimer);
    expect(t).toContain(fi.legal.disclaimer);
    expect(t).toMatch(/does not handle payments/);
  });

  it('links absolute, localized URLs to key pages and guides', () => {
    const t = txt();
    expect(t).toContain('https://example.test/en/how-it-works');
    expect(t).toContain('https://example.test/fi/miten-se-toimii');
    expect(t).toContain('https://example.test/en/guides/lapland-winter-trip-gear');
    expect(t).not.toMatch(/\]\((?!https:\/\/example\.test)/);
  });

  it('lists only categories and cities that have gear (generated from real data)', () => {
    const t = txt();
    expect(t).toContain('https://example.test/en/gear/category/skis');
    expect(t).toContain('https://example.test/fi/varusteet/teltat');
    expect(t).toContain('https://example.test/en/cities/oulu');
    expect(t).toContain('https://example.test/fi/kaupungit/levi');
    for (const empty of ['category/snowboards', 'varusteet/lumilaudat', 'category/kayaks', 'cities/tampere', 'kaupungit/helsinki']) expect(t).not.toContain(empty);
  });

  it('with no listings it has no category or city sections', () => {
    const t = buildLlmsTxt({ rows: [], total: 0 });
    expect(t).not.toContain('## Categories with listings');
    expect(t).not.toContain('## Cities with listings');
  });

  it('contains no private data', () => {
    const everything = buildLlmsFullTxt({ rows: [...rows, { category: 'ski', city: 'Secret street 1' }], total: 4 });
    expect(everything).not.toMatch(/\+358\d|\b\d{7,}\b|@[a-z0-9-]+\.[a-z]{2,}|googleId|coordinates|exactLocation|"phone"|"email"/i);
    expect(everything).not.toContain('Secret street');
  });
});

describe('llms-full.txt', () => {
  it('extends llms.txt with the full text of pages, FAQ and guides in both languages', () => {
    const full = buildLlmsFullTxt(input);
    expect(full.startsWith(buildLlmsTxt(input))).toBe(true);
    expect(full).toContain('# Full text (English)');
    expect(full).toContain('# Kokoteksti (suomeksi)');
    expect(full).toContain('**When is the phone number shared?**');
    expect(full).toContain('**Milloin puhelinnumero jaetaan?**');
    expect(full).toContain('Source: https://example.test/en/faq');
    expect(full).toContain('What to rent for a Lapland winter trip');
  });
});
