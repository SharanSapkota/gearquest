import { describe, expect, it } from 'vitest';
import en from './en.json';
import fi from './fi.json';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((out, [key, value]) => {
    const path = prefix + key;
    if (typeof value === 'string') out[path] = value;
    else Object.assign(out, flatten(value, `${path}.`));
    return out;
  }, {});
}

const files = { fi: flatten(fi as Tree), en: flatten(en as Tree) };
// ICU placeholders such as {count} or {price}; plural bodies and rich tags are ignored.
const placeholders = (s: string) =>
  [...s.matchAll(/\{(\w+)(?:,|\})/g)].map((m) => m[1]).sort().join(',');

describe('message files', () => {
  it('fi and en have exactly the same keys', () => {
    const fiKeys = Object.keys(files.fi);
    const enKeys = Object.keys(files.en);
    expect(fiKeys.filter((k) => !(k in files.en)), 'missing in en').toEqual([]);
    expect(enKeys.filter((k) => !(k in files.fi)), 'missing in fi').toEqual([]);
  });

  it.each(['fi', 'en'] as const)('%s has no empty values', (locale) => {
    const empty = Object.entries(files[locale]).filter(([, v]) => v.trim() === '').map(([k]) => k);
    expect(empty).toEqual([]);
  });

  it('fi and en use the same placeholders', () => {
    const mismatched = Object.keys(files.fi).filter(
      (k) => k in files.en && placeholders(files.fi[k] as string) !== placeholders(files.en[k] as string),
    );
    expect(mismatched).toEqual([]);
  });

  it('every key is translated, not copied (except names and pure formatting)', () => {
    const same = Object.keys(files.fi).filter(
      (k) => files.fi[k] === files.en[k] && /[a-zA-ZäöÅÄÖ]{4,}/.test(files.fi[k] as string),
    );
    // Allowed: brand and language names that are legitimately identical.
    const allowed = new Set(['app.name', 'meta.siteName', 'language.fi', 'language.en', 'gear.perHour', 'gear.rating', 'gearDetail.photoCounter']);
    expect(same.filter((k) => !allowed.has(k))).toEqual([]);
  });

  it('the product name is GearQuest and the old name is gone', () => {
    for (const locale of ['fi', 'en'] as const) {
      expect(files[locale]['app.name']).toBe('GearQuest');
      expect(Object.values(files[locale]).some((v) => /GearShare/i.test(v))).toBe(false);
    }
  });

  it('the legal disclaimer is in both languages and names GearQuest', () => {
    expect(files.en['legal.disclaimer']).toBe(
      'GearQuest is only a platform that connects gear owners and renters. We are not a party to any rental agreement and accept no responsibility for damage, loss, injury, or disputes. All such matters are solely between the renter and the owner.',
    );
    expect(files.fi['legal.disclaimer']).toMatch(/^GearQuest on vain alusta/);
    for (const key of ['legalPages.termsTitle', 'legalPages.privacyTitle', 'legalPages.placeholder']) {
      expect(files.fi[key]).toBeTruthy();
      expect(files.en[key]).toBeTruthy();
    }
  });

  it('Finnish uses the glossary: no "väline", "vuokraisäntä" or "vuokrauspyyntö"', () => {
    const bad = Object.entries(files.fi).filter(([, v]) => /\bväline|vuokraisä|vuokrauspyyn/i.test(v));
    expect(bad).toEqual([]);
  });
});
