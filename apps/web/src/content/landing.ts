// Editorial copy for category and city landing pages (fi + en). Hand-written per category and per
// city; combination pages (category + city) are composed from both plus the city-type tip below,
// and from live data (listing count, price range), so no two pages share the same text.
// Page chrome (buttons, headings) lives in messages/*.json; this file is content, not UI strings.
import type { CATEGORIES } from '@gearquest/shared';

export type Lang = 'fi' | 'en';
export type L = Record<Lang, string>;
export type LandingCategory = Exclude<(typeof CATEGORIES)[number], 'other'>;

export const LANDING_CATEGORIES: LandingCategory[] = ['ski', 'snowboard', 'tent', 'kayak', 'bike', 'climbing', 'camping'];

export type CityType = 'capital' | 'lakes' | 'coast' | 'north' | 'fell';

export type City = {
  key: string; // cityKey(): also the URL slug
  name: string;
  fiIn: string; // inessive/adessive: "Oulussa", "Levillä"
  type: CityType;
  intro: L;
};

export type CategoryContent = {
  slug: L;
  /** H1 / title phrase; {place} is "Suomessa"/"Finland" or the city. */
  h1: L;
  blurb: L;
  intro: L;
  tips: Record<CityType, L>;
  faq: { q: L; a: L }[];
};

export const CITIES: City[] = [
  {
    key: 'helsinki', name: 'Helsinki', fiIn: 'Helsingissä', type: 'capital',
    intro: {
      fi: 'Helsingissä varusteita tarvitaan sekä kaupunkiretkiin että reissuihin pohjoiseen: lenkki Keskuspuistossa, päivä saaristossa tai viikonloppu Lapissa. Pääkaupunkiseudulla asuvat vuokralleantajat jättävät varusteet usein lähelle julkista liikennettä.',
      en: 'In Helsinki people need gear for city outings and for trips north: a loop in Central Park, a day in the archipelago or a weekend in Lapland. Owners in the capital region often live close to public transport, so pickup is easy without a car.',
    },
  },
  {
    key: 'espoo', name: 'Espoo', fiIn: 'Espoossa', type: 'capital',
    intro: {
      fi: 'Espoossa on Nuuksion kansallispuisto kävelymatkan päässä monelle, ja siksi retkeilyvarusteet liikkuvat täällä vilkkaasti. Espoolaiset vuokralleantajat tarjoavat teltat, makuupussit ja kajakit usein suoraan kotoaan.',
      en: 'Espoo borders Nuuksio National Park, so camping gear is in steady demand here. Espoo owners often hand over tents, sleeping bags and kayaks straight from home, a short drive from the park gates.',
    },
  },
  {
    key: 'vantaa', name: 'Vantaa', fiIn: 'Vantaalla', type: 'capital',
    intro: {
      fi: 'Vantaalla Vantaanjoen reitit ja lentokentän läheisyys tekevät varusteiden noudosta helppoa: voit hakea suksilaukun matkalla tai palauttaa pyörän ennen lentoa. Moni vantaalainen vuokraa varusteensa, kun ne seisovat muuten kellarissa.',
      en: 'In Vantaa the Vantaa River trails and the airport make pickup simple: collect a ski bag on the way out or return a bike before a flight. Many owners here rent out gear that would otherwise sit in a basement.',
    },
  },
  {
    key: 'tampere', name: 'Tampere', fiIn: 'Tampereella', type: 'lakes',
    intro: {
      fi: 'Tampere on kahden järven välissä, joten melonta ja pyöräily kuuluvat kaupungin arkeen. Pirkanmaan ladut ja harjut houkuttelevat myös talvella, ja tamperelaiset vuokralleantajat ehtivät usein vastata pyyntöön saman päivän aikana.',
      en: 'Tampere sits between two lakes, so paddling and cycling are part of daily life. The ridges and tracks around Pirkanmaa draw people outdoors in winter too, and owners in Tampere often answer a request within the same day.',
    },
  },
  {
    key: 'oulu', name: 'Oulu', fiIn: 'Oulussa', type: 'north',
    intro: {
      fi: 'Oulu tunnetaan pyöräilykaupunkina, ja talvella samat reitit muuttuvat latu- ja läskipyöräverkostoksi. Oulussa varusteen valinta riippuu vuodenajasta: kesällä kajakki Oulujoelle, talvella sukset tai pulkka jäälle.',
      en: 'Oulu is known as a cycling city, and in winter the same routes turn into ski tracks and fatbike trails. Gear choice here follows the season: a kayak for the Oulu River in summer, skis or a sled for the ice in winter.',
    },
  },
  {
    key: 'turku', name: 'Turku', fiIn: 'Turussa', type: 'coast',
    intro: {
      fi: 'Turusta pääsee Saaristomerelle, joten kajakit ja teltat ovat täällä suosittuja kesäisin. Aurajoen varsi sopii pyörällä, ja saaristoretkelle voi vuokrata koko varustepaketin yhdeltä omistajalta.',
      en: 'From Turku you reach the Archipelago Sea quickly, which makes kayaks and tents popular in summer. The Aura River path suits a bike, and for an island trip you can often rent a whole set of gear from a single owner.',
    },
  },
  {
    key: 'jyvaskyla', name: 'Jyväskylä', fiIn: 'Jyväskylässä', type: 'lakes',
    intro: {
      fi: 'Jyväskylän ympärillä on Päijänteen rantoja, harjupolkuja ja Keski-Suomen kansallispuistoja. Opiskelijakaupungissa varusteita vuokrataan ahkerasti eteenpäin, ja hinnat pysyvät maltillisina.',
      en: 'Around Jyväskylä you find Lake Päijänne shores, esker trails and the national parks of Central Finland. In a student city gear gets rented out often and prices stay modest.',
    },
  },
  {
    key: 'lahti', name: 'Lahti', fiIn: 'Lahdessa', type: 'lakes',
    intro: {
      fi: 'Lahti on hiihdon kaupunki: Salpausselän ladut ja hyppyrimäet tunnetaan kauas. Lahtelaiset vuokralleantajat tuntevat suksivoitelun, ja siksi sukset ovat täällä yleensä kunnossa ja huollettuja.',
      en: 'Lahti is a skiing town: the tracks on the Salpausselkä ridge and the ski jumps are known far beyond Finland. Owners here know their wax, so skis are usually well looked after.',
    },
  },
  {
    key: 'kuopio', name: 'Kuopio', fiIn: 'Kuopiossa', type: 'lakes',
    intro: {
      fi: 'Kuopion Kallavesi ja Puijon maastot tarjoavat sekä melontaa että hiihtoa kaupungin sisällä. Itä-Suomen lumivarma talvi tekee suksista ja lumikengistä suosittuja heti marraskuusta.',
      en: 'Kuopio has Lake Kallavesi for paddling and the Puijo hills for skiing, all inside the city. Winters in eastern Finland are reliable, so skis and snowshoes are in demand from November.',
    },
  },
  {
    key: 'rovaniemi', name: 'Rovaniemi', fiIn: 'Rovaniemellä', type: 'north',
    intro: {
      fi: 'Rovaniemellä napapiiri on lähellä, ja Ounasvaaran ladut alkavat kaupungin keskustasta. Lapin matkaan tarvitaan lämmintä varustusta: makuupussit, sukset ja pulkat vuokrataan usein pidemmäksi aikaa kuin etelässä.',
      en: 'Rovaniemi sits on the Arctic Circle and the Ounasvaara tracks start right by the centre. A Lapland trip calls for warm kit, and sleeping bags, skis and sleds are often rented for longer than in the south.',
    },
  },
  {
    key: 'levi', name: 'Levi', fiIn: 'Levillä', type: 'fell',
    intro: {
      fi: 'Levi on yksi Lapin suurimmista hiihtokeskuksista, ja talvikaudella laskettelu- ja lumilautavarusteet menevät nopeasti. Paikalliset vuokralleantajat tarjoavat vaihtoehdon keskuksen vuokraamoille, usein edullisemmin ja pidemmälle ajalle.',
      en: 'Levi is one of the biggest ski resorts in Lapland, and alpine and snowboard gear goes quickly in the winter season. Local owners are an alternative to the resort rental shops, often cheaper and for longer periods.',
    },
  },
  {
    key: 'ruka', name: 'Ruka', fiIn: 'Rukalla', type: 'fell',
    intro: {
      fi: 'Ruka Kuusamossa on laskettelun ja hiihdon lisäksi lähtöpiste Oulangan kansallispuiston reiteille. Kesällä samat vuokralleantajat tarjoavat teltat, kajakit ja retkeilyvarusteet vaelluksille.',
      en: 'Ruka in Kuusamo is a ski resort and also the starting point for trails into Oulanka National Park. In summer the same owners offer tents, kayaks and hiking gear for treks.',
    },
  },
  {
    key: 'vaasa', name: 'Vaasa', fiIn: 'Vaasassa', type: 'coast',
    intro: {
      fi: 'Vaasasta on lyhyt matka Merenkurkun saaristoon, joka kuuluu Unescon maailmanperintöön. Tasainen maasto tekee Vaasasta pyöräilijän kaupungin, ja rannikon kajakkiretket vaativat usein vain mela- ja pelastusliiviveneen.',
      en: 'Vaasa is a short trip from the Kvarken archipelago, a UNESCO World Heritage site. The flat terrain makes it a cyclist’s town, and coastal kayak trips often need nothing more than a paddle and a lifejacket.',
    },
  },
  {
    key: 'pori', name: 'Pori', fiIn: 'Porissa', type: 'coast',
    intro: {
      fi: 'Porissa Kokemäenjoki ja Yyterin hiekkarannat houkuttavat kesällä retkeilijöitä, ja talvella jäätyneet merenlahdet sopivat hiihtoon. Porilaiset vuokralleantajat tarjoavat usein pyöriä ja telttoja rannikkoreissuille.',
      en: 'In Pori the Kokemäenjoki river and the sandy beaches at Yyteri draw people outdoors in summer, and frozen bays suit skiing in winter. Owners here often lend bikes and tents for coastal trips.',
    },
  },
];

export const cityByKey = (key: string) => CITIES.find((c) => c.key === key);

export const CATEGORY_CONTENT: Record<LandingCategory, CategoryContent> = {
  ski: {
    slug: { fi: 'sukset', en: 'skis' },
    h1: { fi: 'Vuokraa sukset {place}', en: 'Rent skis {place}' },
    blurb: {
      fi: 'Murtomaa-, alppi- ja retkisukset omistajilta lähelläsi, siteet ja sauvat mukana, kun ne on ilmoitettu.',
      en: 'Cross-country, alpine and touring skis from owners near you, with bindings and poles where listed.',
    },
    intro: {
      fi: 'Lunta riittää Suomessa kuukausiksi, mutta suksia tarvitsee moni vain muutaman viikonlopun ajan vuodessa. Vuokraaminen naapurilta tulee halvemmaksi kuin oman parin osto, ja saat varusteen, jonka omistaja tuntee. Tarkista suksen pituus omaan pituuteesi ja painoosi sekä kysy, kuuluvatko siteet ja sauvat hintaan.',
      en: 'Snow covers much of Finland for months, yet many people only ski a few weekends a year. Renting from a neighbour costs less than buying a pair, and you get skis their owner knows well. Match the ski length to your height and weight, and ask whether bindings and poles are included.',
    },
    tips: {
      capital: { fi: 'Pääkaupunkiseudulla ladut avautuvat usein vasta tammikuussa, joten varaa sukset hyvissä ajoin lumitilanteen mukaan.', en: 'In the capital region tracks often open only in January, so plan your rental around the snow report.' },
      lakes: { fi: 'Järvien jäälle ja harjuladuille sopivat perinteiset murtomaasukset parhaiten.', en: 'Classic cross-country skis suit lake ice and esker tracks best.' },
      coast: { fi: 'Rannikolla lumi on epävarmempaa, joten kysy omistajalta joustavaa palautusaikaa.', en: 'Snow is less certain on the coast, so ask the owner about flexible return times.' },
      north: { fi: 'Pohjoisessa kausi on pitkä: harkitse viikon vuokraa, jolloin päivähinta pysyy edullisena.', en: 'The season is long in the north: consider a week-long rental to keep the daily price low.' },
      fell: { fi: 'Tunturikeskuksessa mieti, tarvitsetko alppisukset vai retkisukset, sillä ne on tehty erilaisiin rinteisiin.', en: 'At a fell resort decide between alpine and touring skis first: they are built for different slopes.' },
    },
    faq: [
      { q: { fi: 'Minkä pituiset sukset valitsen?', en: 'What ski length should I choose?' }, a: { fi: 'Murtomaasuksen sopiva pituus riippuu pituudestasi ja painostasi, ja usein se on 10–20 cm pituuttasi pidempi. Kysy omistajalta suositus, koska hän tuntee oman varusteensa.', en: 'The right cross-country ski length depends on your height and weight, and is often 10–20 cm longer than you are tall. Ask the owner for a recommendation, as they know their own equipment.' } },
      { q: { fi: 'Kuuluvatko sauvat ja kengät vuokraan?', en: 'Are poles and boots included?' }, a: { fi: 'Se vaihtelee ilmoituksittain. Tarkista kuvauksesta, mitä mukana on, ja sovi puuttuvista varusteista omistajan kanssa ennen pyynnön lähettämistä.', en: 'It varies by listing. Check the description for what is included and agree on anything missing with the owner before you send a request.' } },
    ],
  },
  snowboard: {
    slug: { fi: 'lumilaudat', en: 'snowboards' },
    h1: { fi: 'Lumilautojen vuokraus {place}', en: 'Rent a snowboard {place}' },
    blurb: {
      fi: 'Lumilaudat, siteet ja lastenvarusteet omistajilta lähelläsi, sovitettuna pituuteen ja laskutyyliin.',
      en: 'Snowboards, bindings and kids’ sets from owners near you, matched to height and riding style.',
    },
    intro: {
      fi: 'Lumilauta vie tilaa ja maksaa paljon, mutta käyttöä kertyy usein vain lomaviikolla. Vuokraamalla saat lautaa, joka sopii taitotasoosi: pehmeä lauta aloittelijalle, jäykempi kokeneelle laskijalle. Kysy aina siteiden koko ja se, mille kenkäkoolle ne on säädetty.',
      en: 'A snowboard takes space and costs a lot, yet it often sees use only during a holiday week. Renting lets you pick a board for your level: a soft board for beginners, a stiffer one for experienced riders. Always ask about binding size and the boot size they are set for.',
    },
    tips: {
      capital: { fi: 'Pääkaupunkiseudun rinteet ovat pieniä, joten lyhyt ja kevyt lauta riittää harjoitteluun ennen tunturimatkaa.', en: 'Slopes near the capital are small, so a short, light board is enough for practice before a fell trip.' },
      lakes: { fi: 'Sisämaan rinteillä ilta-aikaan lumi on jäistä; valitse lauta, jonka kantit on teroitettu.', en: 'Inland slopes can be icy in the evening; pick a board with freshly sharpened edges.' },
      coast: { fi: 'Rannikolta lähdetään usein tunturiin viikonlopuksi, joten sovi noutoaika ennen matkaa.', en: 'People from the coast often head to the fells for a weekend, so agree on pickup before the trip.' },
      north: { fi: 'Pohjoisessa pakkasessa lautaa ja siteitä kannattaa säilyttää lämpimässä ennen laskua.', en: 'In northern frost, keep the board and bindings warm before the run.' },
      fell: { fi: 'Tunturikeskuksessa laudan kunto ratkaisee: kysy kantteja ja pohjan huoltoa ennen kuin lähetät pyynnön.', en: 'At a fell resort board condition decides the day: ask about edges and base waxing before you send a request.' },
    },
    faq: [
      { q: { fi: 'Sopiiko lauta aloittelijalle?', en: 'Is the board suitable for a beginner?' }, a: { fi: 'Moni ilmoitus kertoo laudan tason kuvauksessa. Aloittelijalle sopii pehmeä, lyhyehkö lauta; kysy omistajalta, jos tieto puuttuu.', en: 'Many listings state the level in the description. A soft, slightly shorter board suits a beginner; ask the owner if the information is missing.' } },
      { q: { fi: 'Mukana tulevatko kypärä ja kengät?', en: 'Do a helmet and boots come with it?' }, a: { fi: 'Vain jos ilmoituksessa niin sanotaan. Kypärä on helppo sopia mukaan, kengät sovitetaan harvoin etänä.', en: 'Only if the listing says so. A helmet is easy to add by agreement; boots are rarely fitted remotely.' } },
    ],
  },
  tent: {
    slug: { fi: 'teltat', en: 'tents' },
    h1: { fi: 'Teltan vuokraus {place}', en: 'Tent rental {place}' },
    blurb: {
      fi: 'Teltat yhdelle, kahdelle ja koko perheelle, kevyistä vaellusteltoista tilaviin kupoliteltoihin.',
      en: 'Tents for one, two or the whole family, from light trekking tents to roomy dome tents.',
    },
    intro: {
      fi: 'Telttaa ei kannata ostaa, jos yövyt ulkona vain pari kertaa kesässä. Vuokraa teltta naapurilta ja valitse oikea paino ja koko: kevyt kahden hengen teltta vaellukselle, iso kupoliteltta festareille. Kysy pystytysohje ja tarkista, että kaikki tangot ja tikut ovat mukana.',
      en: 'A tent is hard to justify if you sleep outdoors only a couple of times a summer. Rent from a neighbour and choose the right weight and size: a light two-person tent for trekking, a big dome tent for a festival. Ask for setup instructions and check that all poles and pegs are included.',
    },
    tips: {
      capital: { fi: 'Kaupungista on helppo lähteä Nuuksioon tai saaristoon: kevyt teltta pakkautuu julkisten kulkuneuvojen kyytiin.', en: 'From the city you can reach Nuuksio or the archipelago easily: a light tent packs well for public transport.' },
      lakes: { fi: 'Järvenrannalla tuuli on tavallista, joten kysy teltan tuulenkestävyydestä ja ylimääräisistä kiristysnaruista.', en: 'Wind is common on lakeshores, so ask about the tent’s wind rating and extra guy lines.' },
      coast: { fi: 'Meren läheisyydessä maa on usein kallioista; vaihtoehtona on teltta, joka pysyy pystyssä ilman tikkuja.', en: 'Near the sea the ground is often rock; consider a tent that stands without pegs.' },
      north: { fi: 'Pohjoisessa yöt ovat kylmiä myös kesällä, joten kysy teltan lämpöluokasta ja kosteudenkestosta.', en: 'Nights are cold in the north even in summer, so ask about the tent’s season rating and moisture handling.' },
      fell: { fi: 'Tunturissa tuuli ja sade vaativat vahvarakenteisen teltan; kolmen vuodenajan teltta on minimi.', en: 'On the fells wind and rain demand a sturdy build; a three-season tent is the minimum.' },
    },
    faq: [
      { q: { fi: 'Mitä tarkistan teltasta ennen vuokraa?', en: 'What should I check on a tent before renting?' }, a: { fi: 'Tarkista, että tangot, tikut ja ylälakki ovat mukana, ja kysy, onko kangas vuotanut. Pyydä kuva pystytetystä teltasta, jos ilmoituksessa ei ole.', en: 'Check that poles, pegs and the fly are included, and ask whether the fabric has leaked. Request a photo of the tent pitched if the listing has none.' } },
      { q: { fi: 'Voinko ottaa teltan mukaan ulkomaille?', en: 'Can I take the tent abroad?' }, a: { fi: 'Sovi se omistajan kanssa etukäteen. GearQuest ei aseta rajoituksia, vaan ehdot sovitaan vuokraajan ja omistajan kesken.', en: 'Agree on it with the owner in advance. GearQuest sets no limits; the terms are between renter and owner.' } },
    ],
  },
  kayak: {
    slug: { fi: 'melontavarusteet', en: 'kayaks' },
    h1: { fi: 'Melontavarusteet vuokrattavana {place}', en: 'Kayaks and paddling gear for rent {place}' },
    blurb: {
      fi: 'Kajakit, melat ja pelastusliivit järville ja merelle, yhden ja kahden hengen malleja.',
      en: 'Kayaks, paddles and lifejackets for lakes and sea, in single and two-person models.',
    },
    intro: {
      fi: 'Suomessa on yli sata tuhatta järveä ja pitkä rannikko, mutta kajakki on iso hankinta ja vaatii säilytystilaa. Vuokraa kajakki ja melat omistajalta, joka tietää hyvät reitit. Varmista, että pelastusliivit sopivat sinulle ja että kuljetus onnistuu: moni kajakki kulkee auton katolla.',
      en: 'Finland has well over a hundred thousand lakes and a long coastline, but a kayak is a big purchase that needs storage. Rent a kayak and paddles from an owner who knows good routes. Make sure the lifejackets fit and that transport works: many kayaks travel on a car roof.',
    },
    tips: {
      capital: { fi: 'Helsingin saaristoon pääsee pienellä kajakilla; tarkista meriliikenne ja tuuliennuste ennen lähtöä.', en: 'A small kayak is enough for the Helsinki archipelago; check ferry traffic and the wind forecast before you set out.' },
      lakes: { fi: 'Sisävesillä vakaa retkikajakki on parempi valinta kuin kapea merikajakki.', en: 'On inland waters a stable touring kayak is a better pick than a narrow sea kayak.' },
      coast: { fi: 'Meri vaatii kokemusta: kysy omistajalta, onko kajakissa peräsin ja onko mukana melontahame.', en: 'The sea demands experience: ask the owner whether the kayak has a rudder and whether you need a spray skirt.' },
      north: { fi: 'Pohjoisessa kesä on lyhyt, mutta yötön yö pidentää melontapäiviä; varaa kajakki hyvissä ajoin heinäkuulle.', en: 'The northern summer is short but the midnight sun stretches paddling days; book early for July.' },
      fell: { fi: 'Tunturikeskusten lähellä melotaan usein joilla; tarkista virtaus ja koskiosuudet ennen lähtöä.', en: 'Near fell resorts people usually paddle rivers; check the current and any rapids before setting off.' },
    },
    faq: [
      { q: { fi: 'Tarvitsenko melontakokemusta?', en: 'Do I need paddling experience?' }, a: { fi: 'Rauhallisille järville riittää perusosaaminen ja pelastusliivi. Merelle ja virtavesiin tarvitaan kokemusta tai opas.', en: 'Calm lakes need only basic skills and a lifejacket. The sea and moving water call for experience or a guide.' } },
      { q: { fi: 'Miten kuljetan kajakin?', en: 'How do I transport the kayak?' }, a: { fi: 'Moni kajakki kulkee auton katolla telineissä. Kysy omistajalta kajakin pituus ja paino, ja sovi, tuleeko mukaan kuljetusteline tai -hihnat.', en: 'Many kayaks travel on roof racks. Ask the owner for the length and weight and agree on whether racks or straps come with it.' } },
    ],
  },
  bike: {
    slug: { fi: 'pyorat', en: 'bikes' },
    h1: { fi: 'Pyörän vuokraus {place}', en: 'Bike rental {place}' },
    blurb: {
      fi: 'Maasto-, sähkö- ja läskipyörät omistajilta lähelläsi, kypärä ja lukko mukana kun ne on ilmoitettu.',
      en: 'Mountain, electric and fat bikes from owners near you, with helmet and lock where listed.',
    },
    intro: {
      fi: 'Hyvä pyörä maksaa tuhansia, mutta tarve voi olla yksi viikonloppu poluilla tai kesäloma sähköpyörällä. Valitse pyörä käyttötarkoituksen ja rungon koon mukaan, ja varmista jarrujen kunto. Kysy mukaan kypärä ja lukko, ne puuttuvat usein ilmoituksista.',
      en: 'A good bike costs thousands, yet you may need one only for a weekend on trails or a summer holiday on an e-bike. Pick the bike by use and frame size and check the brakes. Ask for a helmet and lock too, as they are often missing from listings.',
    },
    tips: {
      capital: { fi: 'Pääkaupunkiseudulla pyöräteitä riittää, ja sähköpyörä tekee pitkistä työmatkoistakin kevyitä.', en: 'The capital region has plenty of bike paths, and an e-bike makes long commutes easy.' },
      lakes: { fi: 'Harjut ja järvenrannat sopivat maastopyörälle; kysy rengaspaine ja jousituksen kunto.', en: 'Eskers and lakeshores suit a mountain bike; ask about tyre pressure and suspension condition.' },
      coast: { fi: 'Rannikon tasaisilla teillä sopii kevyt hybridipyörä, ja tuulta vastaan sähköavustus helpottaa.', en: 'On flat coastal roads a light hybrid works well, and electric assist helps against the wind.' },
      north: { fi: 'Pohjoisessa talvipyöräily kasvaa: läskipyörä tai nastarenkaat ovat välttämättömiä jäällä.', en: 'Winter cycling is growing in the north: a fat bike or studded tyres are essential on ice.' },
      fell: { fi: 'Tunturikeskuksissa kesän polkureitit ovat vaativia; valitse jousitettu maastopyörä ja tarkista jarrut.', en: 'Fell resorts have demanding summer trails; choose a full-suspension bike and check the brakes.' },
    },
    faq: [
      { q: { fi: 'Mikä rungon koko minulle sopii?', en: 'Which frame size fits me?' }, a: { fi: 'Runko valitaan pituuden mukaan: noin 170 cm pitkälle sopii usein M-koko. Kysy omistajalta, ja jos mahdollista, istu pyörän päälle noudettaessa.', en: 'Frame size follows your height: someone around 170 cm often fits an M. Ask the owner and, if you can, sit on the bike at pickup.' } },
      { q: { fi: 'Onko sähköpyörän akku ladattu?', en: 'Is the e-bike battery charged?' }, a: { fi: 'Sovi se noudon yhteydessä. Kysy toimintamatka ja se, tuleeko laturi mukaan, jos vuokraat usean päivän ajaksi.', en: 'Settle it at pickup. Ask about range, and whether the charger comes along if you rent for several days.' } },
    ],
  },
  climbing: {
    slug: { fi: 'kiipeilyvarusteet', en: 'climbing-gear' },
    h1: { fi: 'Kiipeilyvarusteiden vuokraus {place}', en: 'Climbing gear rental {place}' },
    blurb: {
      fi: 'Valjaat, kypärät, köydet ja varmistuslaitteet kokeneilta kiipeilijöiltä, tarkastettuina ja kuvattuina.',
      en: 'Harnesses, helmets, ropes and belay devices from experienced climbers, inspected and described.',
    },
    intro: {
      fi: 'Kiipeilyvarusteiden kanssa turvallisuus tulee ensin: vuokraa vain varusteita, joiden ikä ja käyttöhistoria on kerrottu. Kysy omistajalta, milloin köysi ja valjaat on tarkastettu viimeksi, ja käytä vain varusteita, joiden käyttöön olet koulutettu. GearQuest ei tarkasta varusteita, joten vastuu tarkastuksesta on sinulla ja omistajalla.',
      en: 'With climbing gear safety comes first: rent only equipment whose age and use history are described. Ask the owner when the rope and harness were last inspected, and use only gear you are trained to use. GearQuest does not inspect equipment, so checking it is up to you and the owner.',
    },
    tips: {
      capital: { fi: 'Pääkaupunkiseudulla kiipeillään paljon sisäseinillä; valjaat ja kenkäkoot ovat tärkeimmät vuokrattavat.', en: 'Climbing in the capital region is mostly on indoor walls; harnesses and shoe sizes are the most rented items.' },
      lakes: { fi: 'Sisämaan kalliot ovat usein pieniä, joten lyhyt köysi ja muutama pikaremmi riittävät.', en: 'Inland crags are often small, so a short rope and a few quickdraws are enough.' },
      coast: { fi: 'Rannikon kalliot ovat usein graniittia: kysy, onko köysi kestänyt kallion hankaavuutta.', en: 'Coastal crags are often granite: ask how the rope has held up against abrasive rock.' },
      north: { fi: 'Pohjoisessa jääkiipeily alkaa syksyllä; vuokraa vain varusteet, joiden pakkaskestävyys on tiedossa.', en: 'Ice climbing in the north begins in autumn; rent only gear whose cold-weather rating is known.' },
      fell: { fi: 'Tunturikeskusten lähellä on kiipeilyreittejä ja jääseinä; sopikaa varusteiden tarkistus ennen reissua.', en: 'Near fell resorts there are routes and ice walls; agree on a gear check before you go.' },
    },
    faq: [
      { q: { fi: 'Voinko vuokrata kiipeilyvarusteita ilman kokemusta?', en: 'Can I rent climbing gear with no experience?' }, a: { fi: 'Vuokraus onnistuu, mutta käyttö vaatii koulutuksen. Mene ensin kurssille tai kokeneen mukana, äläkä käytä varusteita yksin ensimmäisellä kerralla.', en: 'You can rent, but using the gear requires training. Take a course or go with someone experienced first, and do not use it alone the first time.' } },
      { q: { fi: 'Kuka vastaa varusteen viasta?', en: 'Who is responsible if the gear fails?' }, a: { fi: 'GearQuest on vain alusta, joka yhdistää omistajat ja vuokraajat. Vastuu varusteen kunnosta ja käytöstä on omistajalla ja vuokraajalla.', en: 'GearQuest is only a platform connecting owners and renters. Responsibility for the condition and use of the gear lies with the owner and the renter.' } },
    ],
  },
  camping: {
    slug: { fi: 'retkeilyvarusteet', en: 'camping-gear' },
    h1: { fi: 'Retkeilyvarusteiden vuokraus {place}', en: 'Camping gear rental {place}' },
    blurb: {
      fi: 'Makuupussit, alustat, keittimet ja rinkat retkelle, vaellukselle ja talvileirintään.',
      en: 'Sleeping bags, mats, stoves and backpacks for trips, treks and winter camping.',
    },
    intro: {
      fi: 'Retkeilyvarusteet maksavat yhdessä paljon, mutta kerran kokeiltu retki ei vielä kerro, mitä kannattaa ostaa. Vuokraa makuupussi, alusta ja keitin ensin ja osta vasta sitten omat. Kysy lämpöluokka ja pakkauskoko, ja muista, että jokamiehenoikeus sallii yöpymisen luonnossa, mutta ei kaikkialla.',
      en: 'Camping gear adds up, and one trial trip does not tell you what is worth buying. Rent a sleeping bag, mat and stove first and buy later. Ask about the temperature rating and pack size, and remember that everyman’s right allows camping in nature, but not everywhere.',
    },
    tips: {
      capital: { fi: 'Pääkaupunkiseudulla yön yli -retket Nuuksioon tai saaristoon onnistuvat kevyillä varusteilla.', en: 'Overnight trips to Nuuksio or the archipelago work with light gear from the capital region.' },
      lakes: { fi: 'Järvenrannan retkelle riittää kolmen vuodenajan makuupussi ja keitin; kysy hyttysverkko mukaan.', en: 'A three-season sleeping bag and stove are enough on a lakeshore trip; ask for a mosquito net too.' },
      coast: { fi: 'Saaristoretkellä tarvitset vedenpitävän pakkauksen ja kuivapussin, jotka voi vuokrata samalla.', en: 'For an island trip you need waterproof packing and a dry bag, which you can rent at the same time.' },
      north: { fi: 'Lapin matkalle tarvitaan makuupussi, joka kestää pakkasta; kysy mukavuuslämpötila, ei vain ääriarvoa.', en: 'A Lapland trip needs a sleeping bag that handles frost; ask for the comfort rating, not just the extreme limit.' },
      fell: { fi: 'Tunturireiteillä sää vaihtuu nopeasti: valitse tuulenkestävä varustus ja kevyt rinkka.', en: 'Weather changes fast on fell routes: choose wind-proof kit and a light pack.' },
    },
    faq: [
      { q: { fi: 'Mikä makuupussi sopii talvella?', en: 'Which sleeping bag works in winter?' }, a: { fi: 'Valitse pussi, jonka mukavuuslämpötila on pakkasta kylmempi kuin odotettu yöpakkanen, ja lisää eristävä alusta. Kysy omistajalta lämpöluokka.', en: 'Choose a bag whose comfort rating is colder than the expected night frost, and add an insulating mat. Ask the owner for the rating.' } },
      { q: { fi: 'Saanko leiriytyä missä tahansa?', en: 'Can I camp anywhere?' }, a: { fi: 'Jokamiehenoikeus sallii tilapäisen leiriytymisen, mutta ei kansallispuistojen ja asutuksen läheisyyden kaikissa kohdissa. Tarkista alueen säännöt ennen retkeä.', en: 'Everyman’s right allows temporary camping, but not in every part of national parks or close to homes. Check the rules for the area before you go.' } },
    ],
  },
};

export const categoryFromSlug = (slug: string) =>
  LANDING_CATEGORIES.find((c) => CATEGORY_CONTENT[c].slug.fi === slug || CATEGORY_CONTENT[c].slug.en === slug);
