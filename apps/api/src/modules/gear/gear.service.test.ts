import { describe, expect, it, vi } from 'vitest';
import { createGearService } from './gear.service';

const record = {
  _id: 'g1',
  ownerId: 'u1',
  title: 'Skis',
  description: '',
  category: 'ski',
  condition: 'good',
  images: [],
  city: 'Helsinki',
  address: 'Secret street 1',
  location: { type: 'Point', coordinates: [24.9, 60.1] },
  publicLocation: { type: 'Point', coordinates: [24.901, 60.102] },
  pricing: { dailyCents: 2000 },
  ownerRatingAvg: 0,
  status: 'active',
  createdAt: new Date(),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asRecord = (r: unknown) => r as any;

describe('gear service', () => {
  it('never exposes exact location or address', async () => {
    const repo = { findActive: vi.fn().mockResolvedValue([asRecord(record)]), findById: vi.fn() };
    const [item] = await createGearService(repo).list({});
    expect(item).not.toHaveProperty('address');
    expect(item?.location).toEqual([24.901, 60.102]);
  });

  it('throws gear.notFound for a missing gear', async () => {
    const repo = { findActive: vi.fn(), findById: vi.fn().mockResolvedValue(null) };
    await expect(createGearService(repo).get('x')).rejects.toMatchObject({
      status: 404,
      code: 'gear.notFound',
    });
  });
});
