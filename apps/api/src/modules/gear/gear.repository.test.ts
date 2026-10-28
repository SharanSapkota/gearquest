import { describe, expect, it } from 'vitest';
import { gearFiltersSchema } from '@gearquest/shared';
import { buildGearQuery, buildGearSort } from './gear.repository';

type GeoClause = { publicLocation: { $geoWithin: Record<string, unknown> } };
const parse = (q: Record<string, string>) => gearFiltersSchema.parse(q);

describe('buildGearQuery', () => {
  it('only matches active gear by default', () => {
    expect(buildGearQuery(parse({}))).toEqual({ status: 'active' });
  });

  it('builds simple filters', () => {
    const q = buildGearQuery(parse({ category: 'ski', condition: 'good', minOwnerRating: '4', q: 'alpine' }));
    expect(q).toMatchObject({
      category: 'ski',
      condition: 'good',
      ownerRatingAvg: { $gte: 4 },
      $text: { $search: 'alpine' },
    });
  });

  it('applies the price range to the field of the chosen mode', () => {
    expect(buildGearQuery(parse({ mode: 'hourly', minPriceCents: '100', maxPriceCents: '900' }))).toMatchObject({
      'pricing.hourlyCents': { $exists: true, $gte: 100, $lte: 900 },
    });
    expect(buildGearQuery(parse({ minPriceCents: '100' }))).toMatchObject({
      'pricing.dailyCents': { $exists: true, $gte: 100 },
    });
  });

  it('requires the mode price to exist when only mode is given', () => {
    expect(buildGearQuery(parse({ mode: 'hourly' }))).toMatchObject({
      'pricing.hourlyCents': { $exists: true },
    });
  });

  it('builds a radius filter in radians on publicLocation', () => {
    const q = buildGearQuery(parse({ lat: '60.1', lng: '24.9', radiusKm: '10' }));
    const clause = (q.$and as GeoClause[])[0]?.publicLocation.$geoWithin.$centerSphere as [number[], number];
    expect(clause[0]).toEqual([24.9, 60.1]);
    expect(clause[1]).toBeCloseTo(10 / 6378.1);
  });

  it('combines radius and bbox without clobbering each other', () => {
    const q = buildGearQuery(parse({ lat: '60', lng: '24', radiusKm: '5', bbox: '24,60,25,61' }));
    expect(q.$and).toHaveLength(2);
    expect((q.$and as GeoClause[])[1]?.publicLocation.$geoWithin.$box).toEqual([[24, 60], [25, 61]]);
  });
});

describe('buildGearSort', () => {
  it('sorts newest first by default', () => {
    expect(buildGearSort(parse({}))).toEqual({ createdAt: -1, _id: -1 });
  });

  it('sorts by the price field of the mode, defaulting to daily', () => {
    expect(buildGearSort(parse({ sort: 'priceAsc' }))).toEqual({ 'pricing.dailyCents': 1, _id: 1 });
    expect(buildGearSort(parse({ sort: 'priceDesc', mode: 'hourly' }))).toEqual({
      'pricing.hourlyCents': -1,
      _id: 1,
    });
  });

  it('excludes gear without the price field when sorting by price', () => {
    expect(buildGearQuery(parse({ sort: 'priceAsc' }))).toMatchObject({
      'pricing.dailyCents': { $exists: true },
    });
  });
});
