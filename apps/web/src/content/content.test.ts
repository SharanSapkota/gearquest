import { describe, expect, it } from 'vitest';
import { CATEGORY_CONTENT, CITIES, LANDING_CATEGORIES } from './landing';
import { CONTENT_PAGES, FAQ, GUIDES } from './pages';
import { DESCRIPTION_MAX, DESCRIPTION_MIN } from '../lib/seo/metadata';
import { landingCopy } from '../lib/seo/landing';
import { slugify } from '@gearquest/shared';

// Same glossary as the message files: varuste (not "väline"), vuokralleantaja, pyyntö.
const BANNED = /\bväline|vuokraisä|vuokrauspyyn/i;

const allStrings = (v: unknown): string[] =>
  typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(allStrings) : [];

describe('content completeness', () => {
  it('every localized value exists in fi and en and is non-empty', () => {
    const check = (v: unknown, path: string): void => {
      if (v && typeof v === 'object') {
        const keys = Object.keys(v);
        if (keys.length === 2 && keys.includes('fi') && keys.includes('en')) {
          const l = v as { fi: string; en: string };
          expect(l.fi.trim(), `${path}.fi`).not.toBe('');
          expect(l.en.trim(), `${path}.en`).not.toBe('');
        } else for (const k of keys) check((v as Record<string, unknown>)[k], `${path}.${k}`);
      }
    };
    check(CATEGORY_CONTENT, 'categories');
    check(CITIES, 'cities');
    check(CONTENT_PAGES, 'pages');
    check(GUIDES, 'guides');
    check(FAQ, 'faq');
  });

  it('follows the Finnish glossary', () => {
    const fi = [CATEGORY_CONTENT, CITIES, CONTENT_PAGES, GUIDES, FAQ].flatMap((c) =>
      JSON.stringify(c)
        .match(/"fi":"(?:[^"\\]|\\.)*"/g) ?? [],
    );
    expect(fi.filter((s) => BANNED.test(s))).toEqual([]);
  });

  it('page and guide descriptions are 120-160 characters in both languages', () => {
    const items = [...Object.entries(CONTENT_PAGES).map(([k, p]) => [k, p.description] as const), ...GUIDES.map((g) => [g.slug.en, g.description] as const)];
    for (const [key, d] of items) {
      for (const l of ['fi', 'en'] as const) {
        expect(d[l].length, `${key}.${l}`).toBeGreaterThanOrEqual(DESCRIPTION_MIN);
        expect(d[l].length, `${key}.${l}`).toBeLessThanOrEqual(DESCRIPTION_MAX);
      }
    }
  });

  it('slugs are unique, url-safe and distinct per locale', () => {
    const catSlugs = LANDING_CATEGORIES.flatMap((c) => [CATEGORY_CONTENT[c].slug.fi, CATEGORY_CONTENT[c].slug.en]);
    expect(new Set(catSlugs).size).toBe(catSlugs.length);
    for (const s of [...catSlugs, ...GUIDES.flatMap((g) => [g.slug.fi, g.slug.en])]) expect(slugify(s)).toBe(s);
    for (const c of CITIES) expect(slugify(c.name)).toBe(c.key);
    expect(new Set(CITIES.map((c) => c.key)).size).toBe(CITIES.length);
  });

  it('FAQ answers are short, self-contained paragraphs', () => {
    for (const f of FAQ) for (const l of ['fi', 'en'] as const) {
      expect(f.a[l].length).toBeGreaterThan(60);
      expect(f.a[l].length).toBeLessThan(420);
    }
  });

  it('privacy and rules: pages never claim the phone is public or shared before acceptance', () => {
    const text = JSON.stringify(CONTENT_PAGES) + JSON.stringify(FAQ);
    expect(text).toMatch(/only after the owner has accepted|after acceptance/i);
    expect(text).not.toMatch(/phone number is public|puhelinnumero on julkinen/i);
  });
});

describe('landing copy is unique per page', () => {
  it('no two category/city/combination pages share an H1 or an identical intro', () => {
    for (const lang of ['fi', 'en'] as const) {
      const pages = [
        ...LANDING_CATEGORIES.map((category) => landingCopy({ category }, lang)),
        ...CITIES.map((city) => landingCopy({ city }, lang)),
        ...LANDING_CATEGORIES.flatMap((category) => CITIES.map((city) => landingCopy({ category, city }, lang))),
      ];
      expect(new Set(pages.map((p) => p.h1)).size, `${lang} h1`).toBe(pages.length);
      expect(new Set(pages.map((p) => p.intro.join(' '))).size, `${lang} intro`).toBe(pages.length);
      expect(new Set(allStrings(CITIES.map((c) => c.intro[lang]))).size).toBe(CITIES.length);
    }
  });
  it('combination pages do not repeat the category page intro', () => {
    const cat = landingCopy({ category: 'ski' }, 'en').intro[0];
    expect(landingCopy({ category: 'ski', city: CITIES[0] }, 'en').intro).not.toContain(cat);
  });
  it('uses the Finnish case form for the city and the keyword phrases', () => {
    expect(landingCopy({ category: 'ski', city: CITIES.find((c) => c.key === 'oulu') }, 'fi').h1).toBe('Vuokraa sukset Oulussa');
    expect(landingCopy({ category: 'ski' }, 'fi').h1).toBe('Vuokraa sukset Suomessa');
    expect(landingCopy({ category: 'bike', city: CITIES.find((c) => c.key === 'levi') }, 'en').h1).toBe('Bike rental in Levi');
  });
});
