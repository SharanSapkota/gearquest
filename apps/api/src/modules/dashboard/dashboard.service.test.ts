import { describe, expect, it, vi } from 'vitest';
import { createDashboardService } from './dashboard.service';

const NOW = new Date('2026-10-18T10:00:00Z');
const OWNER = 'o1';
const RENTER = 'r1';
const day = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const as = (v: unknown): any => v;
const rental = (id: string, over: Record<string, unknown> = {}) =>
  as({
    _id: id,
    gearId: 'g1',
    ownerId: OWNER,
    renterId: RENTER,
    gearSnapshot: { title: 'Skis' },
    mode: 'daily',
    startAt: day(2),
    endAt: day(4),
    unitPriceCents: 4000,
    quantity: 2,
    totalCents: 8000,
    status: 'requested',
    expiresAt: day(1),
    createdAt: day(-1),
    ...over,
  });

const parties = [
  { _id: OWNER, name: 'Olli', phone: '+358401111111' },
  { _id: RENTER, name: 'Rita', phone: '+358402222222' },
];
const listing = (id: string, status: string) =>
  as({
    _id: id,
    ownerId: OWNER,
    title: id,
    description: '',
    category: 'ski',
    condition: 'good',
    images: [],
    city: 'Helsinki',
    location: { type: 'Point', coordinates: [24.9, 60.1] },
    publicLocation: { type: 'Point', coordinates: [24.9, 60.1] },
    pricing: { dailyCents: 4000 },
    status,
    createdAt: NOW,
  });

function setup(records: unknown[], listings: unknown[] = []) {
  const rentals = { findByParty: vi.fn().mockResolvedValue(records) };
  const gear = { findAllByOwner: vi.fn().mockResolvedValue(listings) };
  const users = { findByIds: vi.fn().mockResolvedValue(as(parties)) };
  return { rentals, gear, users, service: createDashboardService({ rentals, gear, users }, () => NOW) };
}

// The rentals mapper returns a union (parties get a counterparty); dashboards only return parties' rentals.
const cp = (r: unknown) => (r as { counterparty?: Record<string, unknown> } | undefined)?.counterparty;

describe('owner dashboard', () => {
  const records = [
    rental('pending1'),
    rental('pending2', { createdAt: day(-2) }),
    rental('stale', { expiresAt: day(-1) }), // treated as expired, not pending
    rental('upcoming', { status: 'accepted', startAt: day(1), endAt: day(2) }),
    rental('ended', { status: 'accepted', startAt: day(-3), endAt: day(-2) }),
    rental('done1', { status: 'completed', totalCents: 5000 }),
    rental('done2', { status: 'completed', totalCents: 2500 }),
  ];

  it('computes counts and earnings from completed rentals', async () => {
    const { service } = setup(records, [listing('a', 'active'), listing('b', 'paused'), listing('c', 'active')]);
    const res = await service.owner(OWNER);
    expect(res.counts).toEqual({
      activeListings: 2,
      pendingRequests: 2,
      upcomingRentals: 1,
      completedRentals: 2,
    });
    expect(res.earningsCents).toBe(7500);
    expect(res.listings).toHaveLength(3);
    expect(res.pendingRequests.map((r) => r.id)).toEqual(['pending1', 'pending2']);
  });

  it('limits the pending list to the latest few but still counts all', async () => {
    const many = Array.from({ length: 8 }, (_, i) => rental(`p${i}`));
    const res = await setup(many).service.owner(OWNER);
    expect(res.counts.pendingRequests).toBe(8);
    expect(res.pendingRequests).toHaveLength(5);
  });

  it('is empty-safe', async () => {
    const res = await setup([]).service.owner(OWNER);
    expect(res.counts).toEqual({ activeListings: 0, pendingRequests: 0, upcomingRentals: 0, completedRentals: 0 });
    expect(res.earningsCents).toBe(0);
  });

  it('queries the owner side only', async () => {
    const { service, rentals, gear } = setup([]);
    await service.owner(OWNER);
    expect(rentals.findByParty).toHaveBeenCalledWith('owner', OWNER, ['requested', 'accepted', 'completed'], expect.any(Number));
    expect(gear.findAllByOwner).toHaveBeenCalledWith(OWNER);
  });

  it('never returns the renter phone for a pending request, only after accept', async () => {
    const res = await setup(records).service.owner(OWNER);
    expect(JSON.stringify(res.pendingRequests)).not.toContain('+358402222222');
    expect(JSON.stringify(res)).not.toContain('googleId');
    expect(cp(res.pendingRequests[0])).toMatchObject({ name: 'Rita' });
  });
});

describe('renter dashboard', () => {
  const records = [
    rental('pending'),
    rental('stale', { expiresAt: day(-1) }),
    rental('later', { status: 'accepted', startAt: day(5), endAt: day(6) }),
    rental('soon', { status: 'accepted', startAt: day(1), endAt: day(2) }),
    rental('ended', { status: 'accepted', startAt: day(-3), endAt: day(-2) }),
    rental('declined', { status: 'declined' }),
    rental('done', { status: 'completed' }),
  ];

  it('groups into upcoming (soonest first), pending and past', async () => {
    const res = await setup(records).service.renter(RENTER);
    expect(res.upcoming.map((r) => r.id)).toEqual(['soon', 'later']);
    expect(res.pending.map((r) => r.id)).toEqual(['pending']);
    expect(res.past.map((r) => r.id).sort()).toEqual(['declined', 'done', 'ended', 'stale']);
    expect(res.upcoming[0]?.gear).toEqual({ title: 'Skis' });
  });

  it('reveals the owner phone only for accepted rentals', async () => {
    const res = await setup(records).service.renter(RENTER);
    expect(cp(res.upcoming[0])).toMatchObject({
      phone: '+358401111111',
      whatsappUrl: 'https://wa.me/358401111111',
    });
    expect(cp(res.pending[0])).not.toHaveProperty('phone');
    const declined = res.past.find((r) => r.id === 'declined');
    expect(cp(declined)).not.toHaveProperty('phone');
    const stale = res.past.find((r) => r.id === 'stale');
    expect(cp(stale)).not.toHaveProperty('phone');
  });

  it('queries the renter side only', async () => {
    const { service, rentals } = setup([]);
    await service.renter(RENTER);
    expect(rentals.findByParty).toHaveBeenCalledWith('renter', RENTER, undefined, expect.any(Number));
  });
});
