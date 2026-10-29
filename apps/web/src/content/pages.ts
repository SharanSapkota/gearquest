// Editorial copy for static content pages and guides (fi + en). Facts follow docs/PRD.md:
// GearQuest only connects people (no payments, insurance or disputes), owners approve requests,
// phone numbers are revealed to both parties only after acceptance, requests expire after 48 h.
import type { L } from './landing';

export const CONTENT_UPDATED = '2026-10-29';

export type Faq = { q: L; a: L };
export type Section = { h2: L; body: L[] };
export type ContentPageKey = 'howItWorks' | 'forOwners' | 'forRenters' | 'safety' | 'faq' | 'about';

export type ContentPage = {
  title: L;
  description: L; // 120-160 characters
  /** Short, self-contained, quotable answer shown first. */
  answer: L;
  sections: Section[];
  faq?: Faq[];
};

export const FAQ: Faq[] = [
  {
    q: { fi: 'Mikä GearQuest on?', en: 'What is GearQuest?' },
    a: {
      fi: 'GearQuest on vertaisvuokrauspalvelu Suomessa, jossa ihmiset vuokraavat seikkailuvarusteita, kuten suksia, telttoja, kajakkeja ja pyöriä, toisiltaan. GearQuest yhdistää omistajat ja vuokraajat, mutta ei ole vuokrasopimuksen osapuoli.',
      en: 'GearQuest is a peer-to-peer rental marketplace in Finland where people rent adventure gear such as skis, tents, kayaks and bikes from each other. GearQuest connects owners and renters but is not a party to any rental agreement.',
    },
  },
  {
    q: { fi: 'Miten pyyntö hyväksytään?', en: 'How does approval work?' },
    a: {
      fi: 'Valitset varusteen ja ajan ja lähetät pyynnön. Omistaja hyväksyy tai hylkää sen. Vasta hyväksytty vuokraus varaa ajan: pyyntö ei vielä estä muita varaamasta samaa varustetta. Jos omistaja ei vastaa 48 tunnissa, pyyntö vanhenee.',
      en: 'You pick the gear and the time and send a request. The owner accepts or declines it. Only an accepted rental reserves the time: a pending request does not yet block others from booking the same gear. If the owner does not answer within 48 hours, the request expires.',
    },
  },
  {
    q: { fi: 'Milloin puhelinnumero jaetaan?', en: 'When is the phone number shared?' },
    a: {
      fi: 'Vasta kun omistaja on hyväksynyt vuokrauksen. Silloin molemmat osapuolet näkevät toistensa puhelinnumeron ja saavat WhatsApp-linkin. Ennen hyväksyntää numeroa ei näytetä kenellekään, eikä se koskaan ole julkinen.',
      en: 'Only after the owner has accepted the rental. Then both parties see each other’s phone number and get a WhatsApp link. Before acceptance the number is shown to nobody, and it is never public.',
    },
  },
  {
    q: { fi: 'Kuka vastaa vahingoista?', en: 'Who is responsible for damage?' },
    a: {
      fi: 'Vuokraaja ja omistaja vastaavat asiasta keskenään. GearQuest on vain alusta, joka yhdistää omistajat ja vuokraajat. Emme ole vuokrasopimuksen osapuoli, emmekä vastaa vahingoista, katoamisesta, loukkaantumisista tai riidoista. Sovi varusteen kunnosta ja mahdollisista korvauksista ennen noutoa.',
      en: 'The renter and the owner settle it between themselves. GearQuest is only a platform that connects owners and renters. We are not a party to the rental agreement and do not take responsibility for damage, loss, injury or disputes. Agree on the condition of the gear and any compensation before pickup.',
    },
  },
  {
    q: { fi: 'Mikä on peruutussääntö?', en: 'What is the cancellation rule?' },
    a: {
      fi: 'Kumpi tahansa osapuoli voi perua hyväksytyn vuokrauksen. Peruutettu vuokraus vapauttaa ajan muille. GearQuest ei aseta peruutusmaksuja, joten mahdollisista korvauksista sovitaan suoraan omistajan ja vuokraajan kesken.',
      en: 'Either party can cancel an accepted rental. A cancelled rental frees the time for others. GearQuest sets no cancellation fees, so any compensation is agreed directly between the owner and the renter.',
    },
  },
  {
    q: { fi: 'Onko palvelu ilmainen?', en: 'Is it free?' },
    a: {
      fi: 'GearQuest ei käsittele maksuja. Hinta näytetään euroina tunnilta tai päivältä, ja maksusta sovitaan suoraan omistajan kanssa. Selaaminen ei vaadi tiliä.',
      en: 'GearQuest does not handle payments. Prices are shown in euros per hour or per day, and payment is arranged directly with the owner. Browsing does not require an account.',
    },
  },
  {
    q: { fi: 'Tarvitsenko tilin?', en: 'Do I need an account?' },
    a: {
      fi: 'Varusteiden, kartan ja profiilien selaaminen onnistuu ilman tiliä. Pyyntö ja oman varusteen ilmoittaminen vaativat kirjautumisen Googlella.',
      en: 'Browsing gear, the map and profiles works without an account. Sending a rental request or listing your own gear requires signing in with Google.',
    },
  },
  {
    q: { fi: 'Voiko varusteen vuokrata tunniksi?', en: 'Can I rent gear by the hour?' },
    a: {
      fi: 'Kyllä. Omistaja valitsee, vuokrataanko varuste tunneittain, päivittäin tai molemmilla tavoilla. Tuntivuokralla voi olla vähimmäiskesto. Kokonaishinta lasketaan palvelimella ilmoitetun hinnan mukaan.',
      en: 'Yes. The owner chooses hourly, daily or both. Hourly rentals can have a minimum duration. The total price is calculated on the server from the listed price.',
    },
  },
  {
    q: { fi: 'Mihin sijainti perustuu?', en: 'How is the location shown?' },
    a: {
      fi: 'Kartalla ja ilmoituksessa näkyy vain likimääräinen sijainti noin 300 metrin tarkkuudella sekä kaupunki. Tarkasta noutopaikasta sovitaan omistajan kanssa vuokrauksen hyväksymisen jälkeen.',
      en: 'The map and listing show only an approximate location within about 300 metres, plus the city. You agree on the exact pickup place with the owner after the rental is accepted.',
    },
  },
  {
    q: { fi: 'Miten arvostelut toimivat?', en: 'How do reviews work?' },
    a: {
      fi: 'Kun vuokraus on merkitty päättyneeksi, omistaja ja vuokraaja voivat kumpikin arvostella toisensa asteikolla 1–5 ja kirjoittaa halutessaan kommentin. Yksi arvostelu per osapuoli per vuokraus.',
      en: 'Once a rental is completed, the owner and the renter can each rate the other from 1 to 5 and optionally write a comment. There is one review per party per rental.',
    },
  },
];

const dot = (fi: string, en: string): L => ({ fi, en });

export const CONTENT_PAGES: Record<ContentPageKey, ContentPage> = {
  howItWorks: {
    title: dot('Näin GearQuest toimii', 'How GearQuest works'),
    description: dot(
      'Löydä varuste, lähetä pyyntö, omistaja hyväksyy ja sovitte noudosta WhatsAppissa. Näin vuokraus GearQuestissa etenee vaihe vaiheelta.',
      'Find gear, send a request, the owner approves and you arrange pickup on WhatsApp. This is how a rental on GearQuest works, step by step.',
    ),
    answer: dot(
      'GearQuest on vertaisvuokrauspalvelu Suomessa: löydät varusteen, lähetät pyynnön, omistaja hyväksyy sen ja sovitte noudosta WhatsAppissa. Hinnat ovat euroina tunnilta tai päivältä.',
      'GearQuest is a peer-to-peer gear rental marketplace in Finland: you find gear, send a request, the owner approves it and you arrange pickup on WhatsApp. Prices are in euros per hour or per day.',
    ),
    sections: [
      {
        h2: dot('1. Etsi varuste', '1. Find the gear'),
        body: [
          dot('Selaa varusteita listana tai kartalla ja rajaa haku luokan, hinnan, kunnon, kaupungin ja päivämäärien mukaan. Ilmoituksessa näkyvät kuvat, kuvaus, hinta, omistajan nimi ja arvostelut.', 'Browse gear as a list or on the map and narrow the search by category, price, condition, city and dates. A listing shows photos, description, price, the owner’s name and reviews.'),
        ],
      },
      {
        h2: dot('2. Lähetä pyyntö', '2. Send a request'),
        body: [
          dot('Valitse aika: päivävuokrassa päivämäärät, tuntivuokrassa päivä ja kellonaika. Kirjaudu Googlella ja lähetä pyyntö. Kokonaishinta lasketaan palvelimella omistajan ilmoittaman hinnan mukaan.', 'Pick the time: dates for a daily rental, date and time for an hourly one. Sign in with Google and send the request. The total price is calculated on the server from the owner’s listed price.'),
        ],
      },
      {
        h2: dot('3. Omistaja hyväksyy', '3. The owner approves'),
        body: [
          dot('Omistaja hyväksyy tai hylkää pyynnön. Jos vastausta ei tule 48 tunnissa, pyyntö vanhenee. Vain hyväksytty vuokraus varaa ajan.', 'The owner accepts or declines. If there is no answer within 48 hours, the request expires. Only an accepted rental reserves the time.'),
        ],
      },
      {
        h2: dot('4. Sovi noudosta', '4. Arrange pickup'),
        body: [
          dot('Hyväksynnän jälkeen kumpikin osapuoli näkee toisen puhelinnumeron ja WhatsApp-linkin. Sovitte noutopaikan ja maksun suoraan keskenänne, sillä GearQuest ei käsittele maksuja.', 'After acceptance both parties see each other’s phone number and a WhatsApp link. You agree on the pickup place and payment directly, because GearQuest does not handle payments.'),
        ],
      },
      {
        h2: dot('5. Palauta ja arvostele', '5. Return and review'),
        body: [
          dot('Vuokrauksen jälkeen kumpikin voi merkitä sen päättyneeksi ja arvostella toisensa. Arvostelut näkyvät profiileissa ja auttavat seuraavaa vuokraajaa.', 'After the rental either party can mark it completed and review the other. Reviews appear on profiles and help the next renter.'),
        ],
      },
    ],
    faq: FAQ.slice(1, 4),
  },
  forOwners: {
    title: dot('Vuokraa varusteesi ja ansaitse', 'Rent out your gear and earn'),
    description: dot(
      'Ilmoita sukset, teltat, kajakit tai pyörät vuokralle GearQuestissa, päätä hinta ja hyväksy pyynnöt itse. Näin aloitat varusteiden vuokraamisen Suomessa.',
      'List skis, tents, kayaks or bikes for rent on GearQuest, set your own price and approve requests yourself. Here is how to start renting out gear in Finland.',
    ),
    answer: dot(
      'Omistajana ilmoitat varusteen kuvineen ja hintoineen, päätät itse, kenelle vuokraat, ja sovit noudosta suoraan vuokraajan kanssa. Puhelinnumerosi näkyy vuokraajalle vasta, kun olet hyväksynyt vuokrauksen.',
      'As an owner you list an item with photos and prices, decide who you rent to, and arrange pickup directly with the renter. Your phone number is visible to the renter only after you accept the rental.',
    ),
    sections: [
      {
        h2: dot('Mitä tarvitset', 'What you need'),
        body: [
          dot('Tarvitset Google-tilin, puhelinnumeron ja suostumuksen siihen, että numerosi jaetaan vuokraajalle hyväksynnän jälkeen. Numero ei koskaan näy julkisesti.', 'You need a Google account, a phone number and your consent to share it with the renter after acceptance. The number is never public.'),
        ],
      },
      {
        h2: dot('Ilmoituksen tekeminen', 'Creating a listing'),
        body: [
          dot('Kirjoita selkeä otsikko ja kuvaus, lisää jopa kuusi kuvaa, valitse luokka ja kunto ja aseta tunti- ja/tai päivähinta. Tuntivuokralle voit asettaa vähimmäiskeston. Sijainti näkyy julkisesti vain noin 300 metrin tarkkuudella.', 'Write a clear title and description, add up to six photos, choose a category and condition and set an hourly and/or daily price. For hourly rental you can set a minimum duration. Your location is public only within about 300 metres.'),
        ],
      },
      {
        h2: dot('Pyynnöt ja vastuu', 'Requests and responsibility'),
        body: [
          dot('Saat pyynnöt ilmoituksina hallintanäkymään ja voit hyväksyä tai hylätä ne. Vastaa 48 tunnin kuluessa, muuten pyyntö vanhenee. Sovi varusteen kunnosta ja mahdollisista korvauksista vuokraajan kanssa etukäteen: GearQuest ei vastaa vahingoista tai riidoista.', 'Requests arrive in your dashboard and you accept or decline them. Answer within 48 hours or the request expires. Agree on the condition of the gear and any compensation with the renter beforehand: GearQuest is not responsible for damage or disputes.'),
        ],
      },
    ],
  },
  forRenters: {
    title: dot('Vuokraajalle: näin vuokraat varusteita', 'For renters: how to rent gear'),
    description: dot(
      'Vuokraa sukset, teltat, kajakit ja pyörät naapureilta edullisesti. Näin löydät oikean varusteen, lähetät pyynnön ja sovit noudosta GearQuestissa.',
      'Rent skis, tents, kayaks and bikes from neighbours at a good price. Here is how to find the right gear, send a request and arrange pickup on GearQuest.',
    ),
    answer: dot(
      'Vuokraajana löydät varusteen läheltäsi, näet hinnan euroina ja omistajan arvostelut ja lähetät pyynnön. Kun omistaja hyväksyy, saat hänen puhelinnumeronsa ja WhatsApp-linkin noutoa varten.',
      'As a renter you find gear near you, see the price in euros and the owner’s reviews, and send a request. Once the owner accepts, you get their phone number and a WhatsApp link for pickup.',
    ),
    sections: [
      {
        h2: dot('Valitse viisaasti', 'Choose carefully'),
        body: [
          dot('Lue kuvaus ja katso kaikki kuvat. Tarkista koko, kunto ja se, mitä hintaan kuuluu, kuten siteet, sauvat tai pelastusliivit. Omistajan arvostelut kertovat aiemmista vuokrauksista.', 'Read the description and look at all photos. Check size, condition and what is included, such as bindings, poles or lifejackets. The owner’s reviews tell you about past rentals.'),
        ],
      },
      {
        h2: dot('Pyydä oikea aika', 'Ask for the right time'),
        body: [
          dot('Valitse päivävuokra tai tuntivuokra. Kalenteri näyttää hyväksytyt vuokraukset, jotka estävät ajan. Pyyntö ei sido vielä ketään: omistaja päättää hyväksynnästä.', 'Choose daily or hourly. The calendar shows accepted rentals that block time. A request does not bind anyone yet: the owner decides on acceptance.'),
        ],
      },
      {
        h2: dot('Nouto ja palautus', 'Pickup and return'),
        body: [
          dot('Sovi noutopaikka ja -aika WhatsAppissa hyväksynnän jälkeen. Katsokaa varuste yhdessä läpi ja sopikaa kunnosta ennen kuin lähdet. Palauta varuste sovittuna aikana ja arvostele omistaja.', 'Arrange the pickup place and time on WhatsApp after acceptance. Look the gear over together and agree on its condition before you leave. Return it at the agreed time and review the owner.'),
        ],
      },
    ],
  },
  safety: {
    title: dot('Turvallisuus ja vinkit', 'Safety and tips'),
    description: dot(
      'Vinkit turvalliseen varusteiden vuokraamiseen: tarkista kunto, sovi ehdot etukäteen, pidä yhteys WhatsAppissa ja tunne vastuusi ennen ensimmäistä vuokrausta.',
      'Tips for renting gear safely: check the condition, agree on terms in advance, keep in touch on WhatsApp and know your responsibilities before your first rental.',
    ),
    answer: dot(
      'Tarkista varusteen kunto ennen lähtöä, sovi ehdot ja korvaukset etukäteen ja käytä vain varusteita, joiden käyttöön olet perehtynyt. GearQuest ei tarkasta varusteita eikä vastaa vahingoista.',
      'Check the condition of the gear before you leave, agree on terms and compensation in advance, and use only gear you know how to use. GearQuest does not inspect equipment and is not responsible for damage.',
    ),
    sections: [
      {
        h2: dot('Ennen noutoa', 'Before pickup'),
        body: [
          dot('Kysy omistajalta ikä, käyttöhistoria ja mahdolliset viat. Pyydä lisäkuvia, jos ilmoitus ei kerro tarpeeksi. Turvallisuuskriittisille varusteille, kuten kiipeilyköysille ja kypärille, ikä ja tarkastus ovat tärkeintä.', 'Ask the owner about age, use history and known faults. Request extra photos if the listing does not say enough. For safety-critical gear such as climbing ropes and helmets, age and inspection matter most.'),
        ],
      },
      {
        h2: dot('Noudossa', 'At pickup'),
        body: [
          dot('Käykää varuste yhdessä läpi ja ottakaa tarvittaessa kuvat. Sopikaa, mitä tapahtuu, jos varuste vaurioituu tai katoaa. Näin vältytään väärinkäsityksiltä.', 'Go through the gear together and take photos if needed. Agree on what happens if the gear is damaged or lost. This avoids misunderstandings.'),
        ],
      },
      {
        h2: dot('Retkellä', 'On the trip'),
        body: [
          dot('Seuraa säätä ja jäiden kantavuutta, kerro suunnitelmasi jollekulle ja ota mukaan kartta ja ensiapupakkaus. Ulkoilun riskit ovat omalla vastuullasi.', 'Watch the weather and ice conditions, tell someone your plan and bring a map and first-aid kit. The risks of outdoor activity are your own responsibility.'),
        ],
      },
      {
        h2: dot('Yhteydenpito', 'Staying in touch'),
        body: [
          dot('Puhelinnumero jaetaan vasta hyväksytyssä vuokrauksessa. Älä lähetä numeroasi tai maksutietojasi ennen sitä, äläkä maksa GearQuestin ulkopuolisille tahoille, jotka väittävät edustavansa palvelua.', 'Phone numbers are shared only in an accepted rental. Do not send your number or payment details before that, and do not pay third parties claiming to represent GearQuest.'),
        ],
      },
    ],
  },
  faq: {
    title: dot('Usein kysytyt kysymykset', 'Frequently asked questions'),
    description: dot(
      'Vastaukset yleisimpiin kysymyksiin: miten hyväksyntä toimii, milloin puhelinnumero jaetaan, kuka vastaa vahingoista ja mikä on peruutussääntö GearQuestissa.',
      'Answers to common questions: how approval works, when the phone number is shared, who is responsible for damage and what the cancellation rule is on GearQuest.',
    ),
    answer: dot(
      'GearQuest on vertaisvuokrauspalvelu Suomessa. Omistaja hyväksyy jokaisen pyynnön, puhelinnumero jaetaan vasta hyväksynnän jälkeen, ja vastuu varusteesta on vuokraajalla ja omistajalla, ei GearQuestilla.',
      'GearQuest is a peer-to-peer rental marketplace in Finland. The owner approves every request, the phone number is shared only after acceptance, and responsibility for the gear lies with the renter and owner, not GearQuest.',
    ),
    sections: [],
    faq: FAQ,
  },
  about: {
    title: dot('Tietoa GearQuestista', 'About GearQuest'),
    description: dot(
      'GearQuest on suomalainen vertaisvuokrauspalvelu seikkailuvarusteille. Tutustu siihen, miksi se on tehty ja miten se pitää yksityisyytesi turvassa.',
      'GearQuest is a Finnish peer-to-peer rental marketplace for adventure gear. Learn why it exists and how it keeps your privacy safe.',
    ),
    answer: dot(
      'GearQuest on vertaisvuokrauspalvelu Suomessa, jossa seikkailuvarusteet kiertävät ostettavaksi jäämisen sijaan lainattaviksi. Palvelu yhdistää omistajat ja vuokraajat, mutta ei käsittele maksuja, vakuutuksia eikä riitoja.',
      'GearQuest is a peer-to-peer rental marketplace in Finland where adventure gear is shared rather than left unused in a garage. It connects owners and renters but does not handle payments, insurance or disputes.',
    ),
    sections: [
      {
        h2: dot('Miksi GearQuest on olemassa', 'Why GearQuest exists'),
        body: [
          dot('Hyvät sukset, teltat ja kajakit seisovat useimmiten käyttämättöminä. Samalla moni haluaisi kokeilla lajia ostamatta varusteita. Palvelu tuo nämä kaksi ihmistä yhteen kotimaisella ja selkeällä tavalla.', 'Good skis, tents and kayaks mostly sit unused, while many people want to try a sport without buying the kit. The service brings those two people together in a clear, local way.'),
        ],
      },
      {
        h2: dot('Yksityisyys', 'Privacy'),
        body: [
          dot('Puhelinnumeroa ei näytetä julkisesti eikä ennen hyväksyntää. Karttasijainti on likimääräinen. Sisäänkirjautuminen tapahtuu Googlella, eikä salasanoja tallenneta.', 'Phone numbers are not shown publicly or before acceptance. Map locations are approximate. Sign-in uses Google and no passwords are stored.'),
        ],
      },
      {
        h2: dot('Rajaus', 'What we do not do'),
        body: [
          dot('GearQuest on vain alusta, joka yhdistää varusteiden omistajat ja vuokraajat. Emme ole vuokrasopimuksen osapuoli emmekä vastaa vahingoista, katoamisesta, loukkaantumisista tai riidoista.', 'GearQuest is only a platform that connects gear owners and renters. We are not a party to any rental agreement and are not responsible for damage, loss, injury or disputes.'),
        ],
      },
    ],
  },
};

export type Guide = {
  slug: L;
  title: L;
  description: L; // 120-160 characters
  answer: L;
  sections: Section[];
  related: 'ski' | 'kayak' | 'camping';
};

export const GUIDES: Guide[] = [
  {
    slug: { fi: 'lapin-talvimatka-varusteet', en: 'lapland-winter-trip-gear' },
    related: 'camping',
    title: { fi: 'Mitä vuokrata Lapin talvimatkalle', en: 'What to rent for a Lapland winter trip' },
    description: {
      fi: 'Lapin talvimatkalle ei tarvitse ostaa kaikkea. Katso, mitkä varusteet kannattaa vuokrata ja mitkä ottaa mukaan omina: sukset, pulkka, makuupussi ja vaatteet.',
      en: 'You do not need to buy everything for a Lapland winter trip. See which gear is worth renting and what to bring yourself: skis, sled, sleeping bag and clothing.',
    },
    answer: {
      fi: 'Lapin talvimatkalle kannattaa vuokrata isot ja harvoin käytetyt varusteet: sukset tai lumikengät, pulkka, talvimakuupussi ja tarvittaessa teltta. Vaatteet ja kengät ovat henkilökohtaisia ja ne ostetaan tai lainataan omiksi.',
      en: 'For a Lapland winter trip, rent the big, rarely used items: skis or snowshoes, a sled, a winter sleeping bag and, if needed, a tent. Clothing and boots are personal and best owned or borrowed outright.',
    },
    sections: [
      {
        h2: { fi: 'Liikkumiseen: sukset, lumikengät ja pulkka', en: 'For getting around: skis, snowshoes and sled' },
        body: [
          { fi: 'Retkisukset tai lumikengät vievät sinut ladun ulkopuolelle, ja pulkka kuljettaa varusteet ja lapset. Leveät retkisukset kantavat syvemmässä lumessa kuin kapeat latusukset, joten kerro omistajalle, mihin maastoon olet menossa.', en: 'Touring skis or snowshoes take you off the groomed track, and a sled carries gear and children. Wide touring skis float better in deep snow than narrow track skis, so tell the owner what terrain you are heading for.' },
        ],
      },
      {
        h2: { fi: 'Nukkumiseen: makuupussi ja alusta', en: 'For sleeping: bag and mat' },
        body: [
          { fi: 'Pakkasyönä alusta eristää enemmän kuin makuupussi. Valitse pussi, jonka mukavuuslämpötila on kylmempi kuin odotettu pakkanen, ja lisää hyvä alusta. Talviteltta vaatii vahvan kankaan ja lumitikut.', en: 'On a frosty night the mat insulates more than the bag. Pick a bag whose comfort rating is colder than the expected frost and add a good mat. A winter tent needs strong fabric and snow pegs.' },
        ],
      },
      {
        h2: { fi: 'Mitä ottaa omana mukaan', en: 'What to bring yourself' },
        body: [
          { fi: 'Kerrospukeutuminen, villasukat, hanskat ja lämpimät kengät ovat henkilökohtaisia. Pukeudu kerroksittain: pakkasta voi olla kymmeniä asteita, ja päivä on talvella lyhyt.', en: 'Layered clothing, wool socks, gloves and warm boots are personal. Dress in layers: it can be many degrees below zero, and winter days are short.' },
        ],
      },
      {
        h2: { fi: 'Varaa ajoissa', en: 'Book in good time' },
        body: [
          { fi: 'Joulun ja talvilomien aikaan Lapin varusteet menevät nopeasti. Lähetä pyyntö useita viikkoja etukäteen ja sovi noudosta omistajan kanssa: Levin ja Rovaniemen alueilla omistajat usein tarjoavat varusteita pidemmäksi aikaa.', en: 'Around Christmas and winter holidays Lapland gear goes fast. Send your request several weeks ahead and arrange pickup with the owner: in the Levi and Rovaniemi areas owners often offer gear for longer periods.' },
        ],
      },
    ],
  },
  {
    slug: { fi: 'melonta-suomessa-varusteet', en: 'kayaking-in-finland-gear' },
    related: 'kayak',
    title: { fi: 'Melonta Suomessa: mitä varusteita tarvitset', en: 'Kayaking in Finland: what gear you need' },
    description: {
      fi: 'Ensimmäiselle melontaretkelle tarvitset kajakin, melan, pelastusliivin ja kuivapussin. Katso, mitä kannattaa vuokrata ja miten valitset reitin Suomen vesillä.',
      en: 'For a first paddling trip you need a kayak, paddle, lifejacket and dry bag. See what is worth renting and how to choose a route on Finnish waters.',
    },
    answer: {
      fi: 'Melontaretkelle tarvitset kajakin, melan, pelastusliivin ja kuivapussin, ja vuokraamalla ne saat kokeilla lajia ilman suurta hankintaa. Valitse rauhallinen järvi ensimmäiselle kerralle ja käytä pelastusliiviä aina.',
      en: 'For a paddling trip you need a kayak, paddle, lifejacket and dry bag, and renting them lets you try the sport without a big purchase. Pick a calm lake for your first time and always wear the lifejacket.',
    },
    sections: [
      {
        h2: { fi: 'Valitse kajakki käyttöön', en: 'Pick the kayak for the use' },
        body: [
          { fi: 'Vakaa retkikajakki sopii järville ja aloittelijalle. Kapea merikajakki on nopeampi, mutta kallistuu helpommin. Kahden hengen kajakki sopii perheelle, mutta vaatii yhteistyötä melonnassa.', en: 'A stable touring kayak suits lakes and beginners. A narrow sea kayak is faster but tips more easily. A two-person kayak suits a family but needs teamwork.' },
        ],
      },
      {
        h2: { fi: 'Turvavarusteet', en: 'Safety gear' },
        body: [
          { fi: 'Pelastusliivi on pakollinen kokemuksesta riippumatta. Kuivapussi pitää puhelimen ja vaihtovaatteet kuivina, ja pilli auttaa hätätilanteessa. Kysy omistajalta, onko liivit sinun kokoisesi ja kuuluuko melahame mukaan.', en: 'A lifejacket is essential regardless of experience. A dry bag keeps your phone and spare clothes dry, and a whistle helps in an emergency. Ask the owner if the lifejackets fit you and whether a spray skirt comes with it.' },
        ],
      },
      {
        h2: { fi: 'Reitti ja sää', en: 'Route and weather' },
        body: [
          { fi: 'Tuuli on suurin riski: yli 8 m/s tuulella avoimet selät muuttuvat vaikeiksi. Valitse reitti, jolla pääset rantaan nopeasti, ja kerro suunnitelmasi jollekulle. Meri vaatii enemmän kokemusta kuin sisävesi.', en: 'Wind is the biggest risk: above about 8 m/s open stretches become hard. Choose a route where you can reach shore quickly and tell someone your plan. The sea demands more experience than inland waters.' },
        ],
      },
      {
        h2: { fi: 'Kuljetus ja nouto', en: 'Transport and pickup' },
        body: [
          { fi: 'Kajakki kulkee yleensä auton katolla. Kysy pituus ja paino ja sovi, tuleeko kuljetusteline mukaan. Täytettävä kajakki mahtuu auton takakonttiin, jos tila on rajallinen.', en: 'A kayak usually travels on a car roof. Ask for length and weight and agree on whether a rack comes with it. An inflatable kayak fits in a car boot when space is tight.' },
        ],
      },
    ],
  },
  {
    slug: { fi: 'sukset-vuokralle-ensimmaista-kertaa', en: 'renting-skis-for-the-first-time' },
    related: 'ski',
    title: { fi: 'Suksien vuokraus ensimmäistä kertaa', en: 'Renting skis for the first time' },
    description: {
      fi: 'Vuokraat suksia ensimmäistä kertaa? Katso, miten valitset tyylin ja pituuden, mitä tarkistat noudettaessa ja miten säilytät sukset retken ajan.',
      en: 'Renting skis for the first time? See how to choose the style and length, what to check at pickup and how to look after the skis during your trip.',
    },
    answer: {
      fi: 'Valitse ensin hiihtotyyli: perinteinen tyyli sopii aloittelijalle ja retkisukset metsälle. Sukset mitoitetaan pituuden ja painon mukaan, joten kerro omistajalle molemmat ja tarkista siteet noudossa.',
      en: 'Choose the style first: classic suits beginners and touring skis suit forest trails. Skis are sized by height and weight, so tell the owner both and check the bindings at pickup.',
    },
    sections: [
      {
        h2: { fi: 'Tyyli ratkaisee varusteen', en: 'The style decides the gear' },
        body: [
          { fi: 'Perinteisen tyylin sukset on tarkoitettu latu-uraan, luistelusukset tasaiselle ladulle ja retkisukset lumiselle maastolle. Alppisukset on tehty rinteeseen. Aloittelijalle perinteinen tyyli on helpoin.', en: 'Classic skis are for the groove of a track, skate skis for a firm flat track and touring skis for snowy terrain. Alpine skis are built for slopes. Classic is the easiest for a beginner.' },
        ],
      },
      {
        h2: { fi: 'Pituus ja kunto', en: 'Length and condition' },
        body: [
          { fi: 'Sopiva pituus riippuu pituudesta ja painosta. Pyydä omistajaa kertomaan, millaiselle hiihtäjälle sukset on tarkoitettu. Katso pohja: syvät naarmut tai irtonaiset kohdat kannattaa sopia ennen vuokraa.', en: 'The right length depends on height and weight. Ask the owner what skier the skis are meant for. Look at the base: deep scratches or loose spots are worth agreeing about before the rental.' },
        ],
      },
      {
        h2: { fi: 'Siteet ja kengät', en: 'Bindings and boots' },
        body: [
          { fi: 'Siteen ja kengän järjestelmän on sovittava toisiinsa. Tarkista, mille järjestelmälle siteet on tehty, ja kysy, mukana tulevatko sauvat ja kengät. Kengän koko kannattaa sovittaa jo noudossa.', en: 'The binding and boot system must match. Check which system the bindings use and ask whether poles and boots come with the skis. Try the boot size at pickup.' },
        ],
      },
      {
        h2: { fi: 'Voitelu ja huolto', en: 'Waxing and care' },
        body: [
          { fi: 'Kysy, onko sukset voideltu ja millä voiteella. Älä pese tai voitele uudelleen ilman sopimusta. Palauta sukset kuivina ja kerro mahdollisista naarmuista rehellisesti.', en: 'Ask whether the skis are waxed and with what. Do not wash or re-wax without agreement. Return them dry and tell the owner honestly about any scratches.' },
        ],
      },
    ],
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug.fi === slug || g.slug.en === slug);
