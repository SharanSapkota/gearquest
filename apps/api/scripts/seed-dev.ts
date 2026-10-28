// DEV ONLY. Fills a local database with fake owners and ~20 gear listings so pages, sitemap and
// OG cards can be checked. Refuses to run in production or against a non-local database.
// Everything it creates is marked (googleId "seed:*", email *@seed.invalid) and is replaced on re-run.
// Run: pnpm --filter @gearquest/api seed:dev
import mongoose from 'mongoose';
import type { CATEGORIES } from '@gearquest/shared';
import { fuzzLocation } from '../src/modules/gear/gear.service';
import { GearModel } from '../src/modules/gear/gear.model';
import { UserModel } from '../src/modules/users/users.model';
import { assertSeedAllowed } from './seedGuard';

type Category = (typeof CATEGORIES)[number];
const CITIES = {
  Oulu: { lng: 25.4651, lat: 65.0121 },
  Helsinki: { lng: 24.9384, lat: 60.1699 },
  Tampere: { lng: 23.761, lat: 61.4978 },
  Levi: { lng: 24.802, lat: 67.804 },
  Rovaniemi: { lng: 25.7294, lat: 66.5039 },
} as const;
type City = keyof typeof CITIES;

const OWNERS = ['Aino Korhonen', 'Mikko Laine', 'Sanna Heikkinen', 'Joonas Virtanen', 'Elina Mäkelä'];

// [title, description, category, condition, city, owner index, dailyCents, hourlyCents?]
const GEAR: [string, string, Category, 'new' | 'good' | 'fair', City, number, number, number?][] = [
  ['Atomic Redster murtomaasukset 190 cm', 'Perinteisen tyylin murtomaasukset siteineen ja sauvoineen. Sopivat 75–90 kg hiihtäjälle, pidot huollettu tänä talvena.', 'ski', 'good', 'Oulu', 0, 1800],
  ['Rossignol alppisukset 170 cm', 'Monipuoliset laskettelusukset keskitason laskijalle. Siteet säädetty 60–80 kg painolle, kanttaukset teroitettu.', 'ski', 'good', 'Levi', 1, 3200, 800],
  ['Fischer Spirit retkisukset', 'Leveät retkisukset metsä- ja järvihiihtoon. Nahkakarvapohja pitää nousuissa, siteet sopivat talvikengille.', 'ski', 'fair', 'Rovaniemi', 2, 1500],
  ['Burton Custom lumilauta 156 cm', 'Allmountain-lumilauta kokeneelle laskijalle. Mukana siteet koossa M ja pieni korjaussarja.', 'snowboard', 'good', 'Levi', 3, 3500, 900],
  ['Lumilauta aloittelijalle 148 cm', 'Pehmeä ja anteeksiantava lauta ensimmäisille laskukerroille. Siteet säädettävät koot 38–43.', 'snowboard', 'fair', 'Helsinki', 4, 2200],
  ['Lumilautasetti lapselle 130 cm', 'Lasten lumilauta, siteet ja kypärä yhdessä paketissa. Sopii 8–11-vuotiaalle.', 'snowboard', 'good', 'Tampere', 0, 2600, 700],
  ['Hilleberg Nallo 2 GT teltta', 'Kevyt neljän vuodenajan teltta kahdelle. Kestää tuulen ja lumen, pakkaus alle 3 kg.', 'tent', 'good', 'Rovaniemi', 1, 2800],
  ['MSR Hubba Hubba 3 hengen teltta', 'Tilava kolmen hengen kesäteltta, helppo pystyttää yksin. Mukana tikut ja pohjakangas.', 'tent', 'good', 'Helsinki', 2, 2400],
  ['Kupoliteltta perheelle 5 hengen', 'Iso perheteltta kahdella makuuhuoneella ja eteisellä. Sopii festareille ja mökkikesään.', 'tent', 'fair', 'Tampere', 3, 3000],
  ['Kajakki Prijon Kodiak 2-henk.', 'Vakaa retkikajakki kahdelle, mukana melat, pelastusliivit ja kuivapussi. Sopii järville ja rauhallisille joille.', 'kayak', 'good', 'Oulu', 4, 4500, 1200],
  ['Yksittäiskajakki Tahe Marine 12', 'Kevyt yhden hengen kajakki päiväretkille. Mukana mela ja liivi, kuljetus katolla onnistuu helposti.', 'kayak', 'good', 'Tampere', 0, 3800, 1000],
  ['Pakkautuva kajakki Gumotex', 'Täytettävä kajakki, joka mahtuu auton takakonttiin. Pumppu ja kuljetuslaukku mukana.', 'kayak', 'new', 'Helsinki', 1, 4200],
  ['Maastopyörä Trek Marlin 29"', 'Hyväkuntoinen maastopyörä koossa M, hydrauliset levyjarrut. Sopii metsäpoluille ja soratielle.', 'bike', 'good', 'Oulu', 2, 2500, 600],
  ['Sähköpyörä Cube Reaction Hybrid', 'Sähköavusteinen maastopyörä, toimintamatka noin 80 km. Lukko ja kypärä mukana.', 'bike', 'good', 'Helsinki', 3, 5500, 1400],
  ['Fatbike Specialized Fatboy', 'Läskipyörä talvipyöräilyyn ja hiekalle. Renkaat 4,6", sopii lumisille poluille.', 'bike', 'fair', 'Rovaniemi', 4, 3200],
  ['Kiipeilyvaljaat ja kypärä', 'Petzl-valjaat koossa M ja kypärä. Sopivat sisäseinälle ja ulkokalliolle, tarkastettu keväällä.', 'climbing', 'good', 'Helsinki', 0, 1200],
  ['Kiipeilyköysi 60 m ja varusteet', 'Dynaaminen 9,8 mm köysi, kahdeksan pikaremmiä ja varmistuslaite. Kokeneille kiipeilijöille.', 'climbing', 'good', 'Tampere', 1, 2000],
  ['Makuupussi -20 °C ja makuualusta', 'Untuvamakuupussi talvileirintään ja ilmatäytteinen alusta. Pakkautuu pieneksi rinkkaan.', 'camping', 'good', 'Levi', 2, 1800],
  ['Retkikeitin ja ruuanlaittosetti', 'Jetboil-keitin, kattila ja retkiastiat kahdelle. Sopii päiväretkelle ja viikon vaellukselle.', 'camping', 'good', 'Rovaniemi', 3, 900],
  ['Pulkka ja retkiakku lapsiperheelle', 'Tukeva retkipulkka lasten kuljetukseen ja varusteiden vetoon. Mukana vetohihna.', 'camping', 'fair', 'Oulu', 4, 1000],
];

const photo = (text: string, color: string) =>
  `https://placehold.co/1200x900/${color}/FFFFFF.png?text=${encodeURIComponent(text)}`;
const COLORS = ['205A28', '2F6B3A', '14301A'];
const jitter = (rng: () => number) => (rng() - 0.5) * 0.04;

async function main() {
  const uri = assertSeedAllowed(process.env);
  await mongoose.connect(uri);

  // Replace the previous seed run.
  const old = await UserModel.find({ googleId: /^seed:/ }).select('_id').lean();
  const oldIds = old.map((u) => u._id);
  await GearModel.deleteMany({ ownerId: { $in: oldIds } });
  await UserModel.deleteMany({ _id: { $in: oldIds } });

  const owners = await UserModel.insertMany(
    OWNERS.map((name, i) => ({
      googleId: `seed:${i}`,
      email: `seed-owner-${i}@seed.invalid`,
      name,
      language: 'fi',
      role: 'owner',
      // Fake number in a reserved-looking range; owners must have one by policy. Never logged.
      phone: `+3584570000${String(i).padStart(2, '0')}`,
      whatsappShareConsent: true,
      termsAcceptedAt: new Date(),
    })),
  );

  const docs = GEAR.map(([title, description, category, condition, city, ownerIdx, dailyCents, hourlyCents], n) => {
    const base = CITIES[city];
    const exact = { lng: base.lng + jitter(Math.random), lat: base.lat + jitter(Math.random) };
    const pub = fuzzLocation(exact);
    return {
      ownerId: owners[ownerIdx]?._id,
      title,
      description,
      category,
      condition,
      images: [photo(title, COLORS[n % COLORS.length] as string), photo(category, '205A28')],
      city,
      location: { type: 'Point', coordinates: [exact.lng, exact.lat] },
      publicLocation: pub,
      pricing: { dailyCents, ...(hourlyCents && { hourlyCents, minHours: 2 }) },
      status: 'active',
    };
  });
  await GearModel.insertMany(docs);

  const perCity = Object.keys(CITIES).map((c) => `${c}: ${GEAR.filter((g) => g[4] === c).length}`);
  console.log(`Seeded ${owners.length} owners and ${docs.length} listings (${perCity.join(', ')}).`);
  await mongoose.disconnect();
}

main().catch(async (err: unknown) => {
  console.error(err instanceof Error ? err.message : 'seed failed');
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
