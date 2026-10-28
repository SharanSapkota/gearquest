import { describe, expect, it } from 'vitest';
import { RENTAL_STATUSES } from '@gearquest/shared';
import { toRentalResponse, type PartiesById } from './rentals.mapper';
import type { RentalRecord } from './rentals.repository';

const NOW = new Date('2026-06-01T10:00:00Z');
const OWNER = 'o1';
const RENTER = 'r1';
const STRANGER = 'x1';

const parties: PartiesById = new Map([
  [OWNER, { _id: OWNER, name: 'Olli Owner', phone: '+358401111111', ratingAvg: 4.5, ratingCount: 2 }],
  [RENTER, { _id: RENTER, name: 'Rita Renter', phone: '+358402222222' }],
]);

const make = (status: string, expiresAt = new Date('2026-06-03T10:00:00Z')) =>
  ({
    _id: 'rent1',
    gearId: 'g1',
    ownerId: OWNER,
    renterId: RENTER,
    gearSnapshot: { title: 'Skis' },
    mode: 'daily',
    startAt: new Date('2026-06-05T21:00:00Z'),
    endAt: new Date('2026-06-06T21:00:00Z'),
    unitPriceCents: 2000,
    quantity: 1,
    totalCents: 2000,
    status,
    expiresAt,
    createdAt: new Date('2026-06-01T09:00:00Z'),
  }) as unknown as RentalRecord;

const hasPhoneFields = (res: object) => {
  const cp = (res as { counterparty?: object }).counterparty ?? {};
  return 'phone' in cp || 'whatsappUrl' in cp;
};

describe('counterparty rating', () => {
  it('includes the other party rating', () => {
    const res = toRentalResponse(make('requested'), RENTER, parties, NOW) as {
      counterparty: Record<string, unknown>;
    };
    expect(res.counterparty.ratingAvg).toBe(4.5);
    expect(res.counterparty.ratingCount).toBe(2);
  });
  it('defaults to 0 when the user has no rating fields', () => {
    const res = toRentalResponse(make('requested'), OWNER, parties, NOW) as {
      counterparty: Record<string, unknown>;
    };
    expect(res.counterparty.ratingAvg).toBe(0);
    expect(res.counterparty.ratingCount).toBe(0);
  });
});

describe('phone exposure', () => {
  for (const status of RENTAL_STATUSES) {
    const revealed = status === 'accepted' || status === 'completed';

    it(`${status}: owner ${revealed ? 'sees' : 'does not see'} the renter's phone`, () => {
      const res = toRentalResponse(make(status), OWNER, parties, NOW) as {
        counterparty: Record<string, unknown>;
      };
      expect(res.counterparty.id).toBe(RENTER);
      if (revealed) {
        expect(res.counterparty.phone).toBe('+358402222222');
        expect(res.counterparty.whatsappUrl).toBe('https://wa.me/358402222222');
      } else {
        expect(hasPhoneFields(res)).toBe(false);
      }
    });

    it(`${status}: renter ${revealed ? 'sees' : 'does not see'} the owner's phone`, () => {
      const res = toRentalResponse(make(status), RENTER, parties, NOW) as {
        counterparty: Record<string, unknown>;
      };
      expect(res.counterparty.id).toBe(OWNER);
      if (revealed) {
        expect(res.counterparty.phone).toBe('+358401111111');
        expect(res.counterparty.whatsappUrl).toBe('https://wa.me/358401111111');
      } else {
        expect(hasPhoneFields(res)).toBe(false);
      }
    });

    it(`${status}: a non-party never gets a phone or a counterparty`, () => {
      const res = toRentalResponse(make(status), STRANGER, parties, NOW);
      expect(res).not.toHaveProperty('counterparty');
      expect(res).not.toHaveProperty('role');
      expect(JSON.stringify(res)).not.toContain('358');
    });
  }

  it('phone keys are absent, not null, in the serialized JSON', () => {
    const json = JSON.stringify(toRentalResponse(make('requested'), OWNER, parties, NOW));
    expect(json).not.toContain('phone');
    expect(json).not.toContain('whatsapp');
    expect(json).not.toContain('null');
  });

  it('a stale request is reported as expired and reveals nothing', () => {
    const stale = make('requested', new Date('2026-06-01T09:00:00Z'));
    const res = toRentalResponse(stale, OWNER, parties, NOW);
    expect(res.status).toBe('expired');
    expect(hasPhoneFields(res)).toBe(false);
  });

  it('handles a counterparty without a phone (no keys, no crash)', () => {
    const noPhone: PartiesById = new Map([
      [OWNER, { _id: OWNER, name: 'Olli Owner' }],
      [RENTER, { _id: RENTER, name: 'Rita Renter', phone: null }],
    ]);
    const res = toRentalResponse(make('accepted'), OWNER, noPhone, NOW);
    expect(hasPhoneFields(res)).toBe(false);
    expect((res as { counterparty: { name: string } }).counterparty.name).toBe('Rita Renter');
  });

  it('handles a counterparty that no longer exists', () => {
    const res = toRentalResponse(make('accepted'), OWNER, new Map(), NOW) as {
      counterparty: Record<string, unknown>;
    };
    expect(res.counterparty).toEqual({ id: RENTER, ratingAvg: 0, ratingCount: 0 });
  });

  it('never leaks email or googleId from the user record', () => {
    const rich: PartiesById = new Map([
      [RENTER, { _id: RENTER, name: 'Rita', phone: '+358402222222', email: 'r@x.fi', googleId: 'g' } as never],
    ]);
    const json = JSON.stringify(toRentalResponse(make('accepted'), OWNER, rich, NOW));
    expect(json).not.toContain('r@x.fi');
    expect(json).not.toContain('googleId');
  });
});
