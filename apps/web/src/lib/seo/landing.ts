import {
  CATEGORY_CONTENT,
  CITIES,
  type City,
  type Lang,
  type LandingCategory,
} from '../../content/landing';
import { fitDescription } from './metadata';

export type LandingTarget = { category?: LandingCategory; city?: City };
export type LandingCopy = {
  h1: string;
  intro: string[];
  descriptionParts: string[];
};

const TAIL = {
  fi: 'Lähetä pyyntö, omistaja hyväksyy ja sovitte noudosta WhatsAppissa.',
  en: 'Send a request, the owner approves and you arrange pickup on WhatsApp.',
};
const CITY_H1 = { fi: (c: City) => `Varustevuokraus ${c.fiIn}`, en: (c: City) => `Gear rental in ${c.name}` };
const CITY_BLURB = {
  fi: (c: City) => `Vuokraa sukset, teltat, kajakit, pyörät ja muut seikkailuvarusteet omistajilta ${c.fiIn}.`,
  en: (c: City) => `Rent skis, tents, kayaks, bikes and more adventure gear from owners in ${c.name}.`,
};

const place = (lang: Lang, city?: City) =>
  city ? (lang === 'fi' ? city.fiIn : `in ${city.name}`) : lang === 'fi' ? 'Suomessa' : 'in Finland';

// Copy for a landing page. Category and city text is hand-written (content/landing.ts); a
// combination page uses the city intro plus the category tip for that kind of place, so it never
// repeats the category page's intro.
export function landingCopy(target: LandingTarget, lang: Lang): LandingCopy {
  const { category, city } = target;
  if (category) {
    const cat = CATEGORY_CONTENT[category];
    const h1 = cat.h1[lang].replace('{place}', place(lang, city));
    if (!city) {
      return { h1, intro: [cat.intro[lang]], descriptionParts: [`${h1}.`, cat.blurb[lang], TAIL[lang]] };
    }
    return {
      h1,
      intro: [city.intro[lang], cat.tips[city.type][lang]],
      descriptionParts: [`${h1}.`, cat.blurb[lang], TAIL[lang]],
    };
  }
  const c = city as City;
  return {
    h1: CITY_H1[lang](c),
    intro: [c.intro[lang]],
    descriptionParts: [`${CITY_H1[lang](c)}.`, CITY_BLURB[lang](c), TAIL[lang]],
  };
}

export const landingDescription = (copy: LandingCopy) => fitDescription(copy.descriptionParts);

export const cityOptions = () => CITIES;
