import { describe, expect, it, vi } from 'vitest';
import {
  createGearSchema,
  gearFiltersSchema,
  updateGearSchema,
  type CreateGearInput,
} from '@gearshare/shared';
import { buildGearQuery } from './gear.repository';
import { fuzzLocation, createGearService, isOwnImageUrl } from './gear.service';

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

function makeRepo(overrides: Record<string, unknown> = {}) {
  return {
    findMany: vi.fn().mockResolvedValue({ items: [asRecord(record)], total: 1 }),
    findById: vi.fn().mockResolvedValue(asRecord(record)),
    findDetail: vi.fn(),
    findAllByOwner: vi.fn().mockResolvedValue([asRecord(record)]),
    create: vi.fn().mockImplementation(async (_o: string, data: object) =>
      asRecord({ ...record, ...data }),
    ),
    update: vi.fn().mockImplementation(async (_id: string, patch: object) =>
      asRecord({ ...record, ...patch }),
    ),
    softDelete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

const validInput: CreateGearInput = {
  title: 'Alpine skis',
  description: 'Good skis',
  category: 'ski',
  condition: 'good',
  images: [],
  location: { lng: 24.9, lat: 60.1 },
  city: 'Helsinki',
  pricing: { dailyCents: 2000 },
};

// Great-circle distance in meters.
function distanceM(a: [number, number], b: [number, number]) {
  const rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad;
  const dLng = (b[0] - a[0]) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

describe('gear validation schemas', () => {
  it('accepts hourly-only and daily-only pricing', () => {
    expect(createGearSchema.safeParse({ ...validInput, pricing: { hourlyCents: 500 } }).success).toBe(true);
    expect(createGearSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects missing pricing, non-integer cents, and minHours without hourly', () => {
    expect(createGearSchema.safeParse({ ...validInput, pricing: {} }).success).toBe(false);
    expect(createGearSchema.safeParse({ ...validInput, pricing: { dailyCents: 12.5 } }).success).toBe(false);
    expect(
      createGearSchema.safeParse({ ...validInput, pricing: { dailyCents: 1000, minHours: 2 } }).success,
    ).toBe(false);
  });

  it('allows partial updates but still validates pricing when present', () => {
    expect(updateGearSchema.safeParse({ title: 'New title' }).success).toBe(true);
    expect(updateGearSchema.safeParse({ pricing: {} }).success).toBe(false);
  });

  it('applies filter defaults and coerces query strings', () => {
    const f = gearFiltersSchema.parse({ minPriceCents: '500', bbox: '24,60,25,61' });
    expect(f).toMatchObject({ minPriceCents: 500, page: 1, limit: 20, sort: 'newest' });
    expect(f.bbox).toEqual([24, 60, 25, 61]);
  });

  it('rejects incomplete geo filters, bad bbox, inverted price range and oversize pages', () => {
    expect(gearFiltersSchema.safeParse({ lat: '60', lng: '24' }).success).toBe(false);
    expect(gearFiltersSchema.safeParse({ bbox: '25,60,24,61' }).success).toBe(false);
    expect(gearFiltersSchema.safeParse({ minPriceCents: '900', maxPriceCents: '100' }).success).toBe(false);
    expect(gearFiltersSchema.safeParse({ limit: '500' }).success).toBe(false);
  });
});

describe('gear service: reads', () => {
  it('never exposes exact location or address', async () => {
    const { items } = await createGearService(makeRepo()).list(gearFiltersSchema.parse({}));
    expect(items[0]).not.toHaveProperty('address');
    expect(items[0]?.location).toEqual([24.901, 60.102]);
  });

  it('returns pagination metadata', async () => {
    const res = await createGearService(makeRepo()).list(gearFiltersSchema.parse({ page: '2', limit: '10' }));
    expect(res).toMatchObject({ total: 1, page: 2, limit: 10 });
  });

  it('throws gear.notFound for a missing gear', async () => {
    const repo = makeRepo({ findDetail: vi.fn().mockResolvedValue(null) });
    await expect(createGearService(repo).get('x')).rejects.toMatchObject({
      status: 404,
      code: 'gear.notFound',
    });
  });

  it('returns only basic owner info on detail', async () => {
    const detail = {
      ...record,
      ownerId: { _id: 'u1', name: 'Anna', avatarUrl: 'a.png', ratingAvg: 4.5, phone: '+358', email: 'a@b.fi' },
    };
    const repo = makeRepo({ findDetail: vi.fn().mockResolvedValue(asRecord(detail)) });
    const res = await createGearService(repo).get('g1');
    expect(res.owner).toEqual({ id: 'u1', name: 'Anna', avatarUrl: 'a.png', rating: 4.5 });
    expect(res.ownerId).toBe('u1');
    expect(JSON.stringify(res)).not.toMatch(/phone|email|Secret street/);
  });
});

describe('gear service: owner-only writes', () => {
  it('lets the owner update and delete', async () => {
    const repo = makeRepo();
    const service = createGearService(repo);
    await expect(service.update('u1', 'g1', { title: 'Better skis' })).resolves.toMatchObject({
      title: 'Better skis',
    });
    await service.remove('u1', 'g1');
    expect(repo.softDelete).toHaveBeenCalledWith('g1');
  });

  it('forbids a non-owner from updating or deleting', async () => {
    const repo = makeRepo();
    const service = createGearService(repo);
    await expect(service.update('u2', 'g1', { title: 'x' })).rejects.toMatchObject({
      status: 403,
      code: 'gear.forbidden',
    });
    await expect(service.remove('u2', 'g1')).rejects.toMatchObject({ status: 403 });
    expect(repo.update).not.toHaveBeenCalled();
    expect(repo.softDelete).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing or deleted gear', async () => {
    const service = createGearService(makeRepo({ findById: vi.fn().mockResolvedValue(null) }));
    await expect(service.update('u1', 'g1', {})).rejects.toMatchObject({ status: 404 });
    await expect(service.remove('u1', 'g1')).rejects.toMatchObject({ status: 404 });
  });
});

describe('gear service: location fuzzing', () => {
  it('offsets 150-300 m for any rng values', () => {
    const exact = { lng: 24.9, lat: 60.1 };
    for (const [a, b] of [[0, 0], [0.25, 0.5], [0.5, 0.9], [0.99, 0.3], [1, 0.75]] as const) {
      const seq = [a, b];
      const p = fuzzLocation(exact, () => seq.shift() ?? 0);
      const d = distanceM([exact.lng, exact.lat], p.coordinates);
      expect(d).toBeGreaterThan(149);
      expect(d).toBeLessThan(301);
    }
  });

  it('stores a public location different from the exact one on create', async () => {
    const repo = makeRepo();
    const res = await createGearService(repo, () => 0.5).create('u1', validInput);
    const data = repo.create.mock.calls[0]?.[1];
    expect(data.location.coordinates).toEqual([24.9, 60.1]);
    expect(data.publicLocation.coordinates).not.toEqual([24.9, 60.1]);
    expect(res.location).toEqual(data.publicLocation.coordinates);
  });

  it('regenerates the public location only when location changes', async () => {
    const repo = makeRepo();
    const service = createGearService(repo, () => 0.5);
    await service.update('u1', 'g1', { title: 'Renamed' });
    expect(repo.update.mock.calls[0]?.[1]).not.toHaveProperty('publicLocation');
    await service.update('u1', 'g1', { location: { lng: 25, lat: 61 } });
    const patch = repo.update.mock.calls[1]?.[1];
    expect(patch.location.coordinates).toEqual([25, 61]);
    expect(patch.publicLocation.coordinates).not.toEqual([25, 61]);
  });
});

const CLOUD = 'demo';
const img = (name: string, cloud = CLOUD) =>
  `https://res.cloudinary.com/${cloud}/image/upload/v1700000000/gear/${name}.jpg`;

describe('gear service: image validation', () => {
  const service = (repo = makeRepo()) => ({ repo, svc: createGearService(repo, () => 0.5, CLOUD) });

  it('accepts our own Cloudinary images, up to 6', async () => {
    const { svc } = service();
    const images = Array.from({ length: 6 }, (_, i) => img(`a${i}`));
    await expect(svc.create('u1', { ...validInput, images })).resolves.toMatchObject({ images });
  });

  it('rejects more than 6 images on create and update', async () => {
    const { repo, svc } = service();
    const images = Array.from({ length: 7 }, (_, i) => img(`a${i}`));
    await expect(svc.create('u1', { ...validInput, images })).rejects.toMatchObject({
      status: 400,
      code: 'gear.tooManyImages',
    });
    await expect(svc.update('u1', 'g1', { images })).rejects.toMatchObject({ code: 'gear.tooManyImages' });
    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it.each([
    ['another account', img('a', 'someone-else')],
    ['another host', 'https://evil.example/demo/image/upload/v1/gear/a.jpg'],
    ['a lookalike host', 'https://res.cloudinary.com.evil.example/demo/image/upload/v1/gear/a.jpg'],
    ['plain http', 'http://res.cloudinary.com/demo/image/upload/v1/gear/a.jpg'],
    ['a non-image resource', 'https://res.cloudinary.com/demo/video/upload/v1/gear/a.mp4'],
    ['another folder', 'https://res.cloudinary.com/demo/image/upload/v1/other/a.jpg'],
    ['a query string', `${img('a')}?x=1`],
    ['path traversal', 'https://res.cloudinary.com/demo/image/upload/v1/gear/../a.jpg'],
    ['not a URL', 'nope'],
  ])('rejects %s', async (_label, url) => {
    const { repo, svc } = service();
    await expect(svc.create('u1', { ...validInput, images: [url] })).rejects.toMatchObject({
      status: 400,
      code: 'gear.invalidImageUrl',
    });
    await expect(svc.update('u1', 'g1', { images: [img('ok'), url] })).rejects.toMatchObject({
      code: 'gear.invalidImageUrl',
    });
    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('does not touch images on updates that omit them', async () => {
    const { svc } = service();
    await expect(svc.update('u1', 'g1', { title: 'Renamed' })).resolves.toBeDefined();
  });

  it('isOwnImageUrl accepts urls without a version segment', () => {
    expect(isOwnImageUrl('https://res.cloudinary.com/demo/image/upload/gear/a.webp', CLOUD)).toBe(true);
  });
});

describe('gear service: status and owner listing', () => {
  it('lets the owner pause and activate, and forbids others', async () => {
    const repo = makeRepo();
    const svc = createGearService(repo, () => 0.5, CLOUD);
    await expect(svc.update('u1', 'g1', { status: 'paused' })).resolves.toMatchObject({ status: 'paused' });
    expect(repo.update.mock.calls[0]?.[1]).toMatchObject({ status: 'paused' });
    await expect(svc.update('u2', 'g1', { status: 'active' })).rejects.toMatchObject({ status: 403 });
  });

  it('only allows active or paused through the update schema', () => {
    expect(updateGearSchema.safeParse({ status: 'paused' }).success).toBe(true);
    expect(updateGearSchema.safeParse({ status: 'deleted' }).success).toBe(false);
    expect(createGearSchema.safeParse({ ...validInput, status: 'paused' }).data).not.toHaveProperty('status');
  });

  it('hides paused gear from the public list but shows it in listMine', async () => {
    const paused = { ...record, _id: 'g2', status: 'paused' };
    const all = [asRecord(record), asRecord(paused)];
    // The public query is restricted to status: 'active' (see buildGearQuery); the repo mock honours it.
    const repo = makeRepo({
      findMany: vi.fn().mockImplementation(async (filters) => {
        const items = all.filter((g) => buildGearQuery(filters).status === g.status);
        return { items, total: items.length };
      }),
      findAllByOwner: vi.fn().mockResolvedValue(all),
    });
    const svc = createGearService(repo, () => 0.5, CLOUD);

    const pub = await svc.list(gearFiltersSchema.parse({}));
    expect(pub.items.map((g) => g.id)).toEqual(['g1']);

    const mine = await svc.listMine('u1');
    expect(repo.findAllByOwner).toHaveBeenCalledWith('u1');
    expect(mine.items.map((g) => g.status)).toEqual(['active', 'paused']);
  });

  it('returns the exact pin only in the owner view, and the public view stays offset', async () => {
    const svc = createGearService(makeRepo(), () => 0.5, CLOUD);
    const { items } = await svc.listMine('u1');
    expect(items[0]?.exactLocation).toEqual({ lng: 24.9, lat: 60.1 });
    const pub = await svc.list(gearFiltersSchema.parse({}));
    expect(pub.items[0]).not.toHaveProperty('exactLocation');
  });
});
