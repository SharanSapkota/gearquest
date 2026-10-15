import { describe, expect, it } from 'vitest';
import {
  centsToEuros,
  eurosToCents,
  validateGearForm,
  type GearFormValues,
} from './gearForm';

const valid: GearFormValues = {
  title: 'Alpine skis',
  description: 'Good skis',
  category: 'ski',
  condition: 'good',
  city: 'Helsinki',
  location: { lng: 24.9, lat: 60.1 },
  hourly: false,
  daily: true,
  hourlyPrice: '',
  dailyPrice: '20',
  minHours: '',
};

describe('eurosToCents', () => {
  it.each([
    ['12', 1200],
    ['12.5', 1250],
    ['12,50', 1250],
    ['0.07', 7],
    [' 3 ', 300],
  ])('parses %s', (input, cents) => expect(eurosToCents(input)).toBe(cents));

  it('returns undefined for empty and NaN for garbage', () => {
    expect(eurosToCents('')).toBeUndefined();
    for (const bad of ['abc', '1.234', '-5', '1e3', '1.']) expect(eurosToCents(bad)).toBeNaN();
  });

  it('formats cents back to euros', () => {
    expect(centsToEuros(1250)).toBe('12.50');
  });
});

describe('validateGearForm', () => {
  it('sends daily pricing as integer cents', () => {
    const res = validateGearForm(valid, []);
    expect(res).toMatchObject({ ok: true, data: { pricing: { dailyCents: 2000 } } });
  });

  it('includes minHours only when hourly is enabled', () => {
    const hourly = validateGearForm(
      { ...valid, hourly: true, hourlyPrice: '5,5', minHours: '2' },
      [],
    );
    expect(hourly).toMatchObject({
      ok: true,
      data: { pricing: { hourlyCents: 550, dailyCents: 2000, minHours: 2 } },
    });
    const dailyOnly = validateGearForm({ ...valid, minHours: '3' }, []);
    expect(dailyOnly).toMatchObject({ ok: true });
    expect(dailyOnly.ok && dailyOnly.data.pricing).not.toHaveProperty('minHours');
  });

  it('requires at least one pricing mode', () => {
    const res = validateGearForm({ ...valid, daily: false }, []);
    expect(res).toMatchObject({ ok: false, errors: { pricing: 'pricing' } });
  });

  it('reports field-level errors', () => {
    const res = validateGearForm(
      {
        ...valid,
        title: 'ab',
        category: '',
        city: ' ',
        location: null,
        dailyPrice: '0',
        hourly: true,
        hourlyPrice: 'x',
        minHours: '1.5',
      },
      [],
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(Object.keys(res.errors).sort()).toEqual(
        ['category', 'city', 'dailyPrice', 'hourlyPrice', 'location', 'minHours', 'title'].sort(),
      );
    }
  });

  it('rejects more than 6 photos', () => {
    const urls = Array.from({ length: 7 }, (_, i) => `https://res.cloudinary.com/d/image/upload/gear/${i}.jpg`);
    expect(validateGearForm(valid, urls)).toMatchObject({ ok: false, errors: { images: 'images' } });
  });
});
