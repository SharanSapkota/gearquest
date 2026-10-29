import { CATEGORY_CONTENT, CITIES, LANDING_CATEGORIES, type Lang, type LandingCategory } from '../../content/landing';
import { CONTENT_PAGES, CONTENT_UPDATED, FAQ, GUIDES, type ContentPageKey } from '../../content/pages';
import en from '../../messages/en.json';
import fi from '../../messages/fi.json';
import { absoluteUrl } from '../siteUrl';
import { landingSets } from './sitemapEntries';
import { publicPath } from './paths';
import type { PageKey } from './routes';

// llms.txt / llms-full.txt for AI assistants: plain Markdown built from the same content as the
// site and from the real set of landing pages that have gear. Public information only: no
// listings' owners, contact details, emails, ids of people or exact locations.
export type LlmsInput = { rows: { category: string; city: string }[]; total: number };

const MESSAGES = { en, fi };
const KEY_PAGES: ContentPageKey[] = ['howItWorks', 'forOwners', 'forRenters', 'safety', 'faq', 'about'];

const url = (page: PageKey, lang: Lang, params: Record<string, string> = {}) => absoluteUrl(publicPath(page, lang, params));
const catName = (c: LandingCategory, lang: Lang) => MESSAGES[lang].categories[c];
const catUrl = (c: LandingCategory, lang: Lang) => url('category', lang, { category: CATEGORY_CONTENT[c].slug[lang] });

const COPY = {
  en: {
    summary:
      'GearQuest is a peer-to-peer adventure gear rental marketplace in Finland. People rent skis, snowboards, tents, kayaks, bikes, climbing and camping gear from each other.',
    flowTitle: 'How a rental works',
    flow: [
      'A renter finds gear (list or map) and sends a request for hourly or daily rental. Prices are in euros (EUR) per hour or per day; the total is calculated on the server.',
      'The owner accepts or declines. Only an accepted rental reserves the time; a pending request does not block others. Requests not answered within 48 hours expire.',
      'After acceptance both parties see each other’s phone number and a WhatsApp link, and arrange pickup and payment directly. Phone numbers are never public and never shown before acceptance.',
      'After the rental either party can mark it completed, then both can leave a 1–5 star review (one per party per rental).',
    ],
    flowShort: 'Flow: request -> owner approval -> contact via WhatsApp -> pickup -> review.',
    pagesTitle: 'Key pages',
    categoriesTitle: 'Categories with listings',
    citiesTitle: 'Cities with listings',
    guidesTitle: 'Guides',
    policiesTitle: 'Policies and limits',
    policies: [
      'GearQuest does not handle payments, deposits, insurance or disputes. Renter and owner arrange payment and condition directly.',
      'Public listings show an approximate location (within about 300 m) and the city; exact pickup details are agreed after acceptance.',
      'Browsing is open to everyone; sending requests and listing gear requires signing in with Google.',
    ],
    updated: 'Updated',
    listings: 'active listings',
    languages: 'Languages: Finnish (default, /fi) and English (/en). Every page has an equivalent in the other language.',
    finnishTitle: 'Suomeksi',
    full: 'Full text of the main pages',
  },
  fi: {
    summary:
      'GearQuest on vertaisvuokrauspalvelu seikkailuvarusteille Suomessa. Ihmiset vuokraavat toisiltaan suksia, lumilautoja, telttoja, kajakkeja, pyöriä sekä kiipeily- ja retkeilyvarusteita.',
    flowTitle: 'Näin vuokraus toimii',
    flow: [
      'Vuokraaja löytää varusteen (lista tai kartta) ja lähettää pyynnön tunti- tai päivävuokrasta. Hinnat ovat euroina tunnilta tai päivältä.',
      'Omistaja hyväksyy tai hylkää pyynnön. Vain hyväksytty vuokraus varaa ajan. Pyyntö vanhenee, jos siihen ei vastata 48 tunnissa.',
      'Hyväksynnän jälkeen kumpikin osapuoli näkee toisen puhelinnumeron ja WhatsApp-linkin ja sopii noudosta ja maksusta suoraan. Puhelinnumero ei ole koskaan julkinen eikä näy ennen hyväksyntää.',
      'Vuokrauksen jälkeen se merkitään päättyneeksi, ja molemmat voivat antaa arvostelun asteikolla 1–5.',
    ],
    flowShort: 'Kulku: pyyntö -> omistajan hyväksyntä -> yhteys WhatsAppissa -> nouto -> arvostelu.',
    pagesTitle: 'Tärkeimmät sivut',
    categoriesTitle: 'Luokat, joissa on ilmoituksia',
    citiesTitle: 'Kaupungit, joissa on ilmoituksia',
    guidesTitle: 'Oppaat',
    policiesTitle: 'Säännöt ja rajaukset',
    policies: [
      'GearQuest ei käsittele maksuja, vakuuksia, vakuutuksia eikä riitoja. Vuokraaja ja omistaja sopivat maksusta ja varusteen kunnosta keskenään.',
      'Julkisessa ilmoituksessa näkyy likimääräinen sijainti (noin 300 metrin tarkkuudella) ja kaupunki; tarkka noutopaikka sovitaan hyväksynnän jälkeen.',
      'Selaaminen on avointa kaikille; pyynnön lähettäminen ja varusteen ilmoittaminen vaativat kirjautumisen Googlella.',
    ],
    updated: 'Päivitetty',
    listings: 'aktiivista ilmoitusta',
    languages: 'Kielet: suomi (oletus, /fi) ja englanti (/en). Jokaisella sivulla on vastine toisella kielellä.',
    finnishTitle: 'Suomeksi',
    full: 'Pääsivujen kokoteksti',
  },
} as const;

function section(lang: Lang, input: LlmsInput): string[] {
  const c = COPY[lang];
  const { categories, cities } = landingSets(input.rows);
  const out: string[] = [];
  out.push(`## ${c.flowTitle}`, '', ...c.flow.map((f) => `- ${f}`), '', c.flowShort, '');
  out.push(`## ${c.pagesTitle}`, '');
  out.push(`- [GearQuest](${url('home', lang)}): ${MESSAGES[lang].seo.homeDescription}`);
  for (const k of KEY_PAGES) out.push(`- [${CONTENT_PAGES[k].title[lang]}](${url(k, lang)}): ${CONTENT_PAGES[k].description[lang]}`);
  out.push(`- [${MESSAGES[lang].footer.terms}](${url('terms', lang)})`, `- [${MESSAGES[lang].footer.privacy}](${url('privacy', lang)})`, '');
  const cats = LANDING_CATEGORIES.filter((k) => categories.has(k));
  if (cats.length) {
    out.push(`## ${c.categoriesTitle}`, '', ...cats.map((k) => `- [${catName(k, lang)}](${catUrl(k, lang)}): ${CATEGORY_CONTENT[k].blurb[lang]}`), '');
  }
  const cityList = CITIES.filter((x) => cities.has(x.key));
  if (cityList.length) {
    out.push(`## ${c.citiesTitle}`, '', ...cityList.map((x) => `- [${x.name}](${url('city', lang, { city: x.key })})`), '');
  }
  out.push(`## ${c.guidesTitle}`, '', `- [${MESSAGES[lang].guides.title}](${url('guides', lang)})`);
  out.push(...GUIDES.map((g) => `- [${g.title[lang]}](${url('guide', lang, { slug: g.slug[lang] })}): ${g.description[lang]}`), '');
  out.push(`## ${c.policiesTitle}`, '', ...c.policies.map((p) => `- ${p}`), `- ${MESSAGES[lang].legal.disclaimer}`, '');
  return out;
}

export function buildLlmsTxt(input: LlmsInput): string {
  const en = COPY.en;
  return [
    '# GearQuest',
    '',
    `> ${en.summary}`,
    '',
    `${en.languages} ${en.updated}: ${CONTENT_UPDATED}. ${input.total} ${en.listings}.`,
    `${en.full}: ${absoluteUrl('/llms-full.txt')}`,
    '',
    ...section('en', input),
    `# ${COPY.fi.finnishTitle}`,
    '',
    `> ${COPY.fi.summary}`,
    '',
    ...section('fi', input),
  ].join('\n');
}

const pageBody = (key: ContentPageKey, lang: Lang) => {
  const p = CONTENT_PAGES[key];
  return [
    `### ${p.title[lang]}`,
    `Source: ${url(key, lang)}`,
    '',
    p.answer[lang],
    '',
    ...p.sections.flatMap((s) => [`#### ${s.h2[lang]}`, '', ...s.body.flatMap((b) => [b[lang], ''])]),
  ];
};

export function buildLlmsFullTxt(input: LlmsInput): string {
  const langs: Lang[] = ['en', 'fi'];
  const parts: string[] = [buildLlmsTxt(input), '---', ''];
  for (const lang of langs) {
    parts.push(`# ${lang === 'en' ? 'Full text (English)' : 'Kokoteksti (suomeksi)'}`, '');
    for (const k of KEY_PAGES.filter((x) => x !== 'faq')) parts.push(...pageBody(k, lang));
    parts.push(`### ${CONTENT_PAGES.faq.title[lang]}`, `Source: ${url('faq', lang)}`, '');
    for (const f of FAQ) parts.push(`**${f.q[lang]}**`, '', f.a[lang], '');
    for (const g of GUIDES) {
      parts.push(`### ${g.title[lang]}`, `Source: ${url('guide', lang, { slug: g.slug[lang] })}`, '', g.answer[lang], '');
      for (const s of g.sections) parts.push(`#### ${s.h2[lang]}`, '', ...s.body.flatMap((b) => [b[lang], '']));
    }
    parts.push('---', '');
  }
  return parts.join('\n');
}
