// Lowercase ASCII slug; ä/ö/å and other diacritics are folded ("Pyörä" -> "pyora").
export function slugify(text: string, max = 60): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/, '');
}

// Normalized city for matching and URLs: lowercase, diacritics folded ("Jyväskylä" -> "jyvaskyla").
// Stored as Gear.cityKey; queries compare it exactly, never as a regex built from user input.
export const cityKey = (city: string): string => slugify(city, 100);
