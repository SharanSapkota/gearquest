import { describe, expect, it, vi } from 'vitest';
import { MAX_OPEN_REQUESTS_PER_RENTER } from '@gearshare/shared';
import { createRentalsService } from './rentals.service';
import type { AcceptResult, RentalRecord } from './rentals.repository';

const NOW = new Date('2026-06-01T10:00:00Z');
const clock = () => NOW;

const OWNER = 'o1';
const RENTER = 'r1';
const STRANGER = 'x1';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const as = (v: unknown) => v as any;

const gear = {
  _id: 'g1',
  ownerId: OWNER,
  title: 'Skis',
  images: ['https://res.cloudinary.com/demo/image/upload/gear/a.jpg', 'b'],
  status: 'active',
  pricing: { hourlyCents: 1000, dailyCents: 4000, minHours: 2 },
};
const owner = { _id: OWNER, name: 'Olli', phone: '+358401111111' };
const renter = { _id: RENTER, name: 'Rita', phone: '+358402222222' };

// 5 Jun 00:00 -> 7 Jun 00:00 Helsinki (UTC+3 in June)
const DAILY = {
  gearId: 'g1',
  mode: 'daily' as const,
  startAt: new Date('2026-06-04T21:00:00Z'),
  endAt: new Date('2026-06-06T21:00:00Z'),
};
const HOURLY = {
  gearId: 'g1',
  mode: 'hourly' as const,
  startAt: new Date('2026-06-05T09:00:00Z'),
  endAt: new Date('2026-06-05T12:00:00Z'),
};

const rental = (over: Record<string, unknown> = {}): RentalRecord =>
  as({
    _id: 'rent1',
    gearId: 'g1',
    ownerId: OWNER,
    renterId: RENTER,
    gearSnapshot: { title: 'Skis' },
    mode: 'daily',
    startAt: DAILY.startAt,
    endAt: DAILY.endAt,
    unitPriceCents: 4000,
    quantity: 2,
    totalCents: 8000,
    status: 'requested',
    expiresAt: new Date('2026-06-03T10:00:00Z'),
    createdAt: NOW,
    ...over,
  });

function makeDeps(over: { rentals?: object; gear?: object; users?: object } = {}) {
  const users = new Map([
    [OWNER, owner],
    [RENTER, renter],
  ]);
  const rentals = {
    create: vi.fn().mockImplementation(async (data: object) => rental(data as never)),
    findById: vi.fn().mockResolvedValue(rental()),
    findMine: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    countOpenByRenter: vi.fn().mockResolvedValue(0),
    existsAcceptedOverlap: vi.fn().mockResolvedValue(false),
    findAcceptedInWindow: vi.fn().mockResolvedValue([]),
    transition: vi.fn().mockImplementation(async (_id: string, _from: string, patch: object) =>
      rental(patch as never),
    ),
    acceptIfFree: vi.fn().mockImplementation(
      async (r: RentalRecord): Promise<AcceptResult> => ({
        outcome: 'ok',
        rental: { ...r, status: 'accepted' } as RentalRecord,
      }),
    ),
    expireStale: vi.fn().mockResolvedValue(0),
    ...over.rentals,
  };
  const deps = {
    rentals,
    gear: { findById: vi.fn().mockResolvedValue(as(gear)), ...over.gear },
    users: {
      findById: vi.fn().mockImplementation(async (id: string) => as(users.get(id) ?? null)),
      findByIds: vi.fn().mockImplementation(async (ids: string[]) =>
        as(ids.map((id) => users.get(id)).filter(Boolean)),
      ),
      ...over.users,
    },
  };
  return { deps: as(deps), rentals, gear: deps.gear, users: deps.users };
}

const code = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    const err = e as { status?: number; code?: string };
    return `${err.status} ${err.code}`;
  }
  return null;
};

describe('create', () => {
  it('computes and snapshots the daily price server-side', async () => {
    const { deps, rentals } = makeDeps();
    const res = await createRentalsService(deps, clock).create(RENTER, DAILY);
    const saved = rentals.create.mock.calls[0]?.[0];
    expect(saved).toMatchObject({ unitPriceCents: 4000, quantity: 2, totalCents: 8000, mode: 'daily' });
    expect(res).toMatchObject({ status: 'requested', totalCents: 8000, role: 'renter' });
  });

  it('computes the hourly price', async () => {
    const { deps, rentals } = makeDeps();
    await createRentalsService(deps, clock).create(RENTER, HOURLY);
    expect(rentals.create.mock.calls[0]?.[0]).toMatchObject({
      unitPriceCents: 1000,
      quantity: 3,
      totalCents: 3000,
    });
  });

  it('ignores any client-supplied totals', async () => {
    const { deps, rentals } = makeDeps();
    await createRentalsService(deps, clock).create(RENTER, {
      ...DAILY,
      totalCents: 1,
      unitPriceCents: 1,
    } as never);
    expect(rentals.create.mock.calls[0]?.[0]).toMatchObject({ totalCents: 8000, unitPriceCents: 4000 });
  });

  it('snapshots the gear title and cover image, and sets a 48 h expiry in UTC', async () => {
    const { deps, rentals } = makeDeps();
    await createRentalsService(deps, clock).create(RENTER, DAILY);
    const saved = rentals.create.mock.calls[0]?.[0];
    expect(saved.gearSnapshot).toEqual({
      title: 'Skis',
      coverImage: 'https://res.cloudinary.com/demo/image/upload/gear/a.jpg',
    });
    expect(saved.expiresAt).toEqual(new Date('2026-06-03T10:00:00Z'));
    expect(saved.ownerId).toBe(OWNER);
    expect(saved.renterId).toBe(RENTER);
  });

  it('omits the cover image when the gear has no photos', async () => {
    const { deps, rentals } = makeDeps({ gear: { findById: vi.fn().mockResolvedValue(as({ ...gear, images: [] })) } });
    await createRentalsService(deps, clock).create(RENTER, DAILY);
    expect(rentals.create.mock.calls[0]?.[0].gearSnapshot).toEqual({ title: 'Skis' });
  });

  it('rejects renting your own gear', async () => {
    const { deps, rentals } = makeDeps();
    expect(await code(createRentalsService(deps, clock).create(OWNER, DAILY))).toBe('400 rentals.ownGear');
    expect(rentals.create).not.toHaveBeenCalled();
  });

  it('rejects missing gear (404) and non-active gear (409)', async () => {
    const missing = makeDeps({ gear: { findById: vi.fn().mockResolvedValue(null) } });
    expect(await code(createRentalsService(missing.deps, clock).create(RENTER, DAILY))).toBe('404 gear.notFound');
    for (const status of ['paused', 'deleted']) {
      const d = makeDeps({ gear: { findById: vi.fn().mockResolvedValue(as({ ...gear, status })) } });
      expect(await code(createRentalsService(d.deps, clock).create(RENTER, DAILY))).toBe('409 rentals.gearNotActive');
    }
  });

  it('requires the renter to have a phone number', async () => {
    const d = makeDeps({
      users: { findById: vi.fn().mockResolvedValue(as({ _id: RENTER, name: 'Rita' })) },
    });
    expect(await code(createRentalsService(d.deps, clock).create(RENTER, DAILY))).toBe(
      '409 rentals.renterPhoneRequired',
    );
  });

  it('rejects a mode the gear does not offer', async () => {
    const d = makeDeps({
      gear: { findById: vi.fn().mockResolvedValue(as({ ...gear, pricing: { dailyCents: 4000 } })) },
    });
    expect(await code(createRentalsService(d.deps, clock).create(RENTER, HOURLY))).toBe(
      '400 rentals.modeNotAvailable',
    );
  });

  it('rejects hourly below minHours and a start in the past', async () => {
    const { deps } = makeDeps();
    const svc = createRentalsService(deps, clock);
    expect(
      await code(svc.create(RENTER, { ...HOURLY, endAt: new Date('2026-06-05T10:00:00Z') })),
    ).toBe('400 rentals.belowMinHours');
    expect(
      await code(svc.create(RENTER, { ...HOURLY, startAt: new Date('2026-05-31T09:00:00Z') })),
    ).toBe('400 rentals.startInPast');
  });

  it('limits open requests per renter', async () => {
    const d = makeDeps({ rentals: { countOpenByRenter: vi.fn().mockResolvedValue(MAX_OPEN_REQUESTS_PER_RENTER) } });
    expect(await code(createRentalsService(d.deps, clock).create(RENTER, DAILY))).toBe(
      '429 rentals.tooManyOpenRequests',
    );
    const ok = makeDeps({ rentals: { countOpenByRenter: vi.fn().mockResolvedValue(MAX_OPEN_REQUESTS_PER_RENTER - 1) } });
    expect(await code(createRentalsService(ok.deps, clock).create(RENTER, DAILY))).toBeNull();
  });
});

describe('create: overlap rules', () => {
  it('rejects a request overlapping an ACCEPTED rental', async () => {
    const d = makeDeps({ rentals: { existsAcceptedOverlap: vi.fn().mockResolvedValue(true) } });
    expect(await code(createRentalsService(d.deps, clock).create(RENTER, DAILY))).toBe('409 rentals.overlap');
    expect(d.rentals.create).not.toHaveBeenCalled();
  });

  it('checks overlap with the requested gear and range', async () => {
    const { deps, rentals } = makeDeps();
    await createRentalsService(deps, clock).create(RENTER, DAILY);
    expect(rentals.existsAcceptedOverlap).toHaveBeenCalledWith('g1', DAILY.startAt, DAILY.endAt);
  });

  it('pending requests do not block: creating while others are pending succeeds', async () => {
    // The overlap query only matches accepted rentals (see repository tests), so a gear that
    // has overlapping pending requests reports no accepted overlap.
    const { deps, rentals } = makeDeps();
    expect(await code(createRentalsService(deps, clock).create(RENTER, DAILY))).toBeNull();
    expect(rentals.create).toHaveBeenCalledTimes(1);
  });
});

describe('accept', () => {
  it('lets the owner accept and reveals the renter phone in the response', async () => {
    const { deps, rentals } = makeDeps();
    const res = (await createRentalsService(deps, clock).accept(OWNER, 'rent1')) as {
      status: string;
      counterparty: { phone?: string; whatsappUrl?: string };
    };
    expect(rentals.acceptIfFree).toHaveBeenCalledTimes(1);
    expect(res.status).toBe('accepted');
    expect(res.counterparty.phone).toBe('+358402222222');
    expect(res.counterparty.whatsappUrl).toBe('https://wa.me/358402222222');
  });

  it('only the owner can accept: renter 403, stranger 404', async () => {
    const { deps, rentals } = makeDeps();
    const svc = createRentalsService(deps, clock);
    expect(await code(svc.accept(RENTER, 'rent1'))).toBe('403 rentals.forbidden');
    expect(await code(svc.accept(STRANGER, 'rent1'))).toBe('404 rentals.notFound');
    expect(rentals.acceptIfFree).not.toHaveBeenCalled();
  });

  it('blocks accept when the owner has no phone', async () => {
    const d = makeDeps({
      users: { findById: vi.fn().mockResolvedValue(as({ _id: OWNER, name: 'Olli' })) },
    });
    expect(await code(createRentalsService(d.deps, clock).accept(OWNER, 'rent1'))).toBe(
      '409 rentals.ownerPhoneRequired',
    );
    expect(d.rentals.acceptIfFree).not.toHaveBeenCalled();
  });

  it('re-checks overlap at accept time: an overlap result is a 409', async () => {
    const d = makeDeps({
      rentals: { acceptIfFree: vi.fn().mockResolvedValue({ outcome: 'overlap' }) },
    });
    expect(await code(createRentalsService(d.deps, clock).accept(OWNER, 'rent1'))).toBe('409 rentals.overlap');
  });

  it('a request changed by someone else in the meantime is a 409', async () => {
    const d = makeDeps({
      rentals: { acceptIfFree: vi.fn().mockResolvedValue({ outcome: 'notPending' }) },
    });
    expect(await code(createRentalsService(d.deps, clock).accept(OWNER, 'rent1'))).toBe(
      '409 rentals.invalidTransition',
    );
  });

  it('refuses a stale request even though the sweep has not run', async () => {
    const d = makeDeps({
      rentals: { findById: vi.fn().mockResolvedValue(rental({ expiresAt: new Date('2026-06-01T09:00:00Z') })) },
    });
    expect(await code(createRentalsService(d.deps, clock).accept(OWNER, 'rent1'))).toBe('409 rentals.expired');
    expect(d.rentals.acceptIfFree).not.toHaveBeenCalled();
  });

  it.each(['accepted', 'declined', 'cancelled', 'completed', 'expired'])(
    'cannot accept a %s rental',
    async (status) => {
      const d = makeDeps({ rentals: { findById: vi.fn().mockResolvedValue(rental({ status })) } });
      expect(await code(createRentalsService(d.deps, clock).accept(OWNER, 'rent1'))).toMatch(/^409 /);
      expect(d.rentals.acceptIfFree).not.toHaveBeenCalled();
    },
  );

  it('two overlapping pending requests: only the first accept wins', async () => {
    // Stateful stand-in for the repository's atomic accept: same rules, in memory.
    const accepted: RentalRecord[] = [];
    const pending = [
      rental({ _id: 'a', renterId: 'r1' }),
      rental({ _id: 'b', renterId: 'r2', startAt: new Date('2026-06-05T21:00:00Z'), endAt: new Date('2026-06-07T21:00:00Z') }),
    ];
    const acceptIfFree = vi.fn().mockImplementation(async (r: RentalRecord): Promise<AcceptResult> => {
      const clash = accepted.some((x) => x.startAt < r.endAt && x.endAt > r.startAt);
      if (clash) return { outcome: 'overlap' };
      const done = { ...r, status: 'accepted' } as RentalRecord;
      accepted.push(done);
      return { outcome: 'ok', rental: done };
    });
    const d = makeDeps({
      rentals: {
        acceptIfFree,
        findById: vi.fn().mockImplementation(async (id: string) => pending.find((p) => String(p._id) === id) ?? null),
      },
    });
    const svc = createRentalsService(d.deps, clock);
    const results = await Promise.all([code(svc.accept(OWNER, 'a')), code(svc.accept(OWNER, 'b'))]);
    expect(results.filter((r) => r === null)).toHaveLength(1);
    expect(results.filter((r) => r === '409 rentals.overlap')).toHaveLength(1);
    expect(accepted).toHaveLength(1);
  });

  it('back-to-back accepted rentals are fine (half-open ranges)', async () => {
    const accepted: RentalRecord[] = [];
    const first = rental({ _id: 'a' });
    const second = rental({ _id: 'b', startAt: first.endAt, endAt: new Date('2026-06-08T21:00:00Z') });
    const acceptIfFree = vi.fn().mockImplementation(async (r: RentalRecord): Promise<AcceptResult> => {
      if (accepted.some((x) => x.startAt < r.endAt && x.endAt > r.startAt)) return { outcome: 'overlap' };
      accepted.push(r);
      return { outcome: 'ok', rental: { ...r, status: 'accepted' } as RentalRecord };
    });
    const d = makeDeps({
      rentals: {
        acceptIfFree,
        findById: vi.fn().mockImplementation(async (id: string) => (id === 'a' ? first : second)),
      },
    });
    const svc = createRentalsService(d.deps, clock);
    expect(await code(svc.accept(OWNER, 'a'))).toBeNull();
    expect(await code(svc.accept(OWNER, 'b'))).toBeNull();
  });
});

describe('decline', () => {
  it('owner declines a pending request', async () => {
    const { deps, rentals } = makeDeps();
    const res = await createRentalsService(deps, clock).decline(OWNER, 'rent1');
    expect(rentals.transition).toHaveBeenCalledWith('rent1', 'requested', { status: 'declined', decidedAt: NOW }, NOW);
    expect(res).toMatchObject({ status: 'declined' });
  });

  it('renter 403, stranger 404, non-pending 409', async () => {
    const { deps } = makeDeps();
    const svc = createRentalsService(deps, clock);
    expect(await code(svc.decline(RENTER, 'rent1'))).toBe('403 rentals.forbidden');
    expect(await code(svc.decline(STRANGER, 'rent1'))).toBe('404 rentals.notFound');
    const acc = makeDeps({ rentals: { findById: vi.fn().mockResolvedValue(rental({ status: 'accepted' })) } });
    expect(await code(createRentalsService(acc.deps, clock).decline(OWNER, 'rent1'))).toBe(
      '409 rentals.invalidTransition',
    );
  });

  it('a lost race (conditional update matched nothing) is a 409, not a silent success', async () => {
    const d = makeDeps({ rentals: { transition: vi.fn().mockResolvedValue(null) } });
    expect(await code(createRentalsService(d.deps, clock).decline(OWNER, 'rent1'))).toBe(
      '409 rentals.invalidTransition',
    );
  });
});

describe('cancel', () => {
  it('renter cancels a pending request and the actor is recorded', async () => {
    const { deps, rentals } = makeDeps();
    await createRentalsService(deps, clock).cancel(RENTER, 'rent1');
    expect(rentals.transition).toHaveBeenCalledWith(
      'rent1',
      'requested',
      { status: 'cancelled', cancelledAt: NOW, cancelledBy: 'renter' },
      NOW,
    );
  });

  it('owner cannot cancel a pending request', async () => {
    const { deps } = makeDeps();
    expect(await code(createRentalsService(deps, clock).cancel(OWNER, 'rent1'))).toBe('403 rentals.forbidden');
  });

  it('either party can cancel an accepted rental before it ends', async () => {
    const accepted = rental({ status: 'accepted' });
    for (const [who, expected] of [
      [OWNER, 'owner'],
      [RENTER, 'renter'],
    ] as const) {
      const d = makeDeps({ rentals: { findById: vi.fn().mockResolvedValue(accepted) } });
      await createRentalsService(d.deps, clock).cancel(who, 'rent1');
      expect(d.rentals.transition).toHaveBeenCalledWith(
        'rent1',
        'accepted',
        { status: 'cancelled', cancelledAt: NOW, cancelledBy: expected },
        NOW,
      );
    }
  });

  it('stranger gets 404; completed/declined/cancelled cannot be cancelled', async () => {
    const { deps } = makeDeps();
    expect(await code(createRentalsService(deps, clock).cancel(STRANGER, 'rent1'))).toBe('404 rentals.notFound');
    for (const status of ['completed', 'declined', 'cancelled']) {
      const d = makeDeps({ rentals: { findById: vi.fn().mockResolvedValue(rental({ status })) } });
      expect(await code(createRentalsService(d.deps, clock).cancel(RENTER, 'rent1'))).toBe(
        '409 rentals.invalidTransition',
      );
    }
  });
});

describe('complete', () => {
  const ended = (over: Record<string, unknown> = {}) =>
    rental({ status: 'accepted', startAt: new Date('2026-05-30T09:00:00Z'), endAt: new Date('2026-05-31T09:00:00Z'), ...over });

  it('either party can complete after the end time; completedAt is set', async () => {
    for (const who of [OWNER, RENTER]) {
      const d = makeDeps({ rentals: { findById: vi.fn().mockResolvedValue(ended()) } });
      const res = await createRentalsService(d.deps, clock).complete(who, 'rent1');
      expect(d.rentals.transition).toHaveBeenCalledWith(
        'rent1',
        'accepted',
        { status: 'completed', completedAt: NOW },
        NOW,
      );
      expect(res).toMatchObject({ status: 'completed' });
    }
  });

  it('is rejected before the end time', async () => {
    const d = makeDeps({ rentals: { findById: vi.fn().mockResolvedValue(rental({ status: 'accepted' })) } });
    expect(await code(createRentalsService(d.deps, clock).complete(OWNER, 'rent1'))).toBe('409 rentals.notEnded');
    expect(d.rentals.transition).not.toHaveBeenCalled();
  });

  it('only parties; only accepted rentals', async () => {
    const d = makeDeps({ rentals: { findById: vi.fn().mockResolvedValue(ended()) } });
    expect(await code(createRentalsService(d.deps, clock).complete(STRANGER, 'rent1'))).toBe('404 rentals.notFound');
    for (const status of ['requested', 'declined', 'cancelled', 'completed']) {
      const x = makeDeps({ rentals: { findById: vi.fn().mockResolvedValue(ended({ status })) } });
      expect(await code(createRentalsService(x.deps, clock).complete(OWNER, 'rent1'))).toMatch(/^409 /);
    }
  });

  it('the completed rental reveals phones to both parties', async () => {
    const d = makeDeps({
      rentals: {
        findById: vi.fn().mockResolvedValue(ended()),
        transition: vi.fn().mockResolvedValue(ended({ status: 'completed', completedAt: NOW })),
      },
    });
    const res = (await createRentalsService(d.deps, clock).complete(RENTER, 'rent1')) as {
      counterparty: { phone?: string };
    };
    expect(res.counterparty.phone).toBe('+358401111111');
  });
});

describe('get', () => {
  it('parties can view; strangers get 404', async () => {
    const { deps } = makeDeps();
    const svc = createRentalsService(deps, clock);
    expect(await code(svc.get(OWNER, 'rent1'))).toBeNull();
    expect(await code(svc.get(RENTER, 'rent1'))).toBeNull();
    expect(await code(svc.get(STRANGER, 'rent1'))).toBe('404 rentals.notFound');
  });

  it('unknown id is 404', async () => {
    const d = makeDeps({ rentals: { findById: vi.fn().mockResolvedValue(null) } });
    expect(await code(createRentalsService(d.deps, clock).get(OWNER, 'nope'))).toBe('404 rentals.notFound');
  });

  it('no phone while requested, phone once accepted', async () => {
    const requested = (await createRentalsService(makeDeps().deps, clock).get(OWNER, 'rent1')) as object;
    expect(JSON.stringify(requested)).not.toContain('phone');
    const d = makeDeps({ rentals: { findById: vi.fn().mockResolvedValue(rental({ status: 'accepted' })) } });
    const accepted = (await createRentalsService(d.deps, clock).get(OWNER, 'rent1')) as {
      counterparty: { phone?: string };
    };
    expect(accepted.counterparty.phone).toBe('+358402222222');
  });

  it('reports a stale request as expired', async () => {
    const d = makeDeps({
      rentals: { findById: vi.fn().mockResolvedValue(rental({ expiresAt: new Date('2026-06-01T09:00:00Z') })) },
    });
    expect(await createRentalsService(d.deps, clock).get(OWNER, 'rent1')).toMatchObject({ status: 'expired' });
  });
});

describe('listMine', () => {
  it('returns paginated items with the caller-relative counterparty and no early phones', async () => {
    const d = makeDeps({
      rentals: {
        findMine: vi.fn().mockResolvedValue({
          items: [rental(), rental({ _id: 'rent2', status: 'accepted' })],
          total: 7,
        }),
      },
    });
    const query = { role: 'owner' as const, page: 2, limit: 2 };
    const res = (await createRentalsService(d.deps, clock).listMine(OWNER, query)) as {
      items: { id: string; counterparty: { id: string; phone?: string } }[];
      page: number;
      limit: number;
      total: number;
    };
    expect(d.rentals.findMine).toHaveBeenCalledWith(OWNER, query, NOW);
    expect(res).toMatchObject({ page: 2, limit: 2, total: 7 });
    expect(res.items[0]?.counterparty).toEqual({ id: RENTER, name: 'Rita' });
    expect(res.items[1]?.counterparty.phone).toBe('+358402222222');
  });

  it('shows stale requests as expired', async () => {
    const d = makeDeps({
      rentals: {
        findMine: vi.fn().mockResolvedValue({
          items: [rental({ expiresAt: new Date('2026-06-01T09:00:00Z') })],
          total: 1,
        }),
      },
    });
    const res = (await createRentalsService(d.deps, clock).listMine(RENTER, { role: 'renter', page: 1, limit: 20 })) as {
      items: { status: string }[];
    };
    expect(res.items[0]?.status).toBe('expired');
  });
});

describe('availability', () => {
  it('returns only blocked ranges, without who booked', async () => {
    const d = makeDeps({
      rentals: {
        findAcceptedInWindow: vi.fn().mockResolvedValue([
          { _id: 'z', renterId: RENTER, ownerId: OWNER, startAt: DAILY.startAt, endAt: DAILY.endAt, totalCents: 1 },
        ]),
      },
    });
    const from = new Date('2026-06-01T00:00:00Z');
    const to = new Date('2026-06-30T00:00:00Z');
    const res = await createRentalsService(d.deps, clock).availability('g1', { from, to });
    expect(res.blocked).toEqual([{ startAt: DAILY.startAt, endAt: DAILY.endAt }]);
    expect(JSON.stringify(res)).not.toContain(RENTER);
    expect(d.rentals.findAcceptedInWindow).toHaveBeenCalledWith('g1', from, to);
  });

  it('404s for unknown gear', async () => {
    const d = makeDeps({ gear: { findById: vi.fn().mockResolvedValue(null) } });
    const range = { from: new Date('2026-06-01T00:00:00Z'), to: new Date('2026-06-02T00:00:00Z') };
    expect(await code(createRentalsService(d.deps, clock).availability('nope', range))).toBe('404 gear.notFound');
  });
});

describe('expireStale', () => {
  it('sweeps with the current time and returns the count', async () => {
    const d = makeDeps({ rentals: { expireStale: vi.fn().mockResolvedValue(3) } });
    expect(await createRentalsService(d.deps, clock).expireStale()).toBe(3);
    expect(d.rentals.expireStale).toHaveBeenCalledWith(NOW);
  });
});
