import { describe, expect, it } from 'vitest';
import { RENTAL_STATUSES } from '@gearquest/shared';
import { AppError } from '../../lib/errors';
import {
  assertTransition,
  effectiveStatus,
  type RentalAction,
  type RentalActor,
  type RentalStatus,
} from './rentals.stateMachine';

const START = new Date('2026-06-05T09:00:00Z');
const END = new Date('2026-06-05T17:00:00Z');
const DURING = new Date('2026-06-05T12:00:00Z');
const AFTER = new Date('2026-06-06T08:00:00Z');
const BEFORE = new Date('2026-06-01T10:00:00Z');

const rental = (status: RentalStatus, expiresAt = new Date('2026-06-03T10:00:00Z')) => ({
  status,
  expiresAt,
  endAt: END,
});

const ACTIONS: RentalAction[] = ['accept', 'decline', 'cancel', 'complete'];
const ACTORS: RentalActor[] = ['owner', 'renter'];
const key = (s: string, a: string, who: string) => `${s}|${a}|${who}`;

function code(fn: () => unknown) {
  try {
    fn();
  } catch (e) {
    if (e instanceof AppError) return `${e.status} ${e.code}`;
    throw e;
  }
  return null;
}

describe('state machine: exhaustive matrix', () => {
  // The only allowed (status, action, actor) combinations before the rental ends.
  const allowedBeforeEnd = new Map<string, string>([
    [key('requested', 'accept', 'owner'), 'accepted'],
    [key('requested', 'decline', 'owner'), 'declined'],
    [key('requested', 'cancel', 'renter'), 'cancelled'],
    [key('accepted', 'cancel', 'owner'), 'cancelled'],
    [key('accepted', 'cancel', 'renter'), 'cancelled'],
  ]);
  // After the end time the only allowed move is complete.
  const allowedAfterEnd = new Map<string, string>([
    [key('accepted', 'complete', 'owner'), 'completed'],
    [key('accepted', 'complete', 'renter'), 'completed'],
  ]);

  for (const status of RENTAL_STATUSES) {
    for (const action of ACTIONS) {
      for (const who of ACTORS) {
        const k = key(status, action, who);

        it(`before end: ${k}`, () => {
          // A requested rental has not expired at this instant.
          const now = status === 'accepted' ? DURING : BEFORE;
          const expected = allowedBeforeEnd.get(k);
          if (expected) {
            expect(assertTransition(rental(status), action, who, now)).toBe(expected);
          } else {
            expect(code(() => assertTransition(rental(status), action, who, now))).not.toBeNull();
          }
        });

        it(`after end: ${k}`, () => {
          const expected = allowedAfterEnd.get(k);
          const r = rental(status, new Date('2026-06-03T10:00:00Z'));
          if (expected) {
            expect(assertTransition(r, action, who, AFTER)).toBe(expected);
          } else {
            expect(code(() => assertTransition(r, action, who, AFTER))).not.toBeNull();
          }
        });
      }
    }
  }
});

describe('state machine: error codes', () => {
  it('wrong role on a valid state is 403', () => {
    expect(code(() => assertTransition(rental('requested'), 'accept', 'renter', BEFORE))).toBe(
      '403 rentals.forbidden',
    );
    expect(code(() => assertTransition(rental('requested'), 'decline', 'renter', BEFORE))).toBe(
      '403 rentals.forbidden',
    );
  });

  it('owner cannot cancel a pending request (must decline)', () => {
    expect(code(() => assertTransition(rental('requested'), 'cancel', 'owner', BEFORE))).toBe(
      '403 rentals.forbidden',
    );
  });

  it('terminal states reject every action with invalidTransition', () => {
    for (const status of ['declined', 'cancelled', 'completed'] as const) {
      for (const action of ACTIONS) {
        expect(code(() => assertTransition(rental(status), action, 'owner', DURING))).toBe(
          '409 rentals.invalidTransition',
        );
      }
    }
  });

  it('complete before the end time is rejected', () => {
    expect(code(() => assertTransition(rental('accepted'), 'complete', 'owner', DURING))).toBe(
      '409 rentals.notEnded',
    );
    expect(code(() => assertTransition(rental('accepted'), 'complete', 'owner', START))).toBe(
      '409 rentals.notEnded',
    );
  });

  it('complete is allowed exactly at the end time', () => {
    expect(assertTransition(rental('accepted'), 'complete', 'renter', END)).toBe('completed');
  });

  it('cancelling an accepted rental after it ended is rejected', () => {
    expect(code(() => assertTransition(rental('accepted'), 'cancel', 'renter', AFTER))).toBe(
      '409 rentals.alreadyEnded',
    );
  });
});

describe('expiry', () => {
  const expiresAt = new Date('2026-06-03T10:00:00Z');

  it('a requested rental is expired exactly at expiresAt, not before', () => {
    expect(effectiveStatus({ status: 'requested', expiresAt }, new Date(expiresAt.getTime() - 1))).toBe(
      'requested',
    );
    expect(effectiveStatus({ status: 'requested', expiresAt }, expiresAt)).toBe('expired');
  });

  it('other statuses are never reported as expired', () => {
    for (const status of ['accepted', 'declined', 'cancelled', 'completed'] as const) {
      expect(effectiveStatus({ status, expiresAt }, AFTER)).toBe(status);
    }
  });

  it('a stale request cannot be accepted, declined or cancelled even before the sweep ran', () => {
    const stale = rental('requested', new Date('2026-06-01T09:59:00Z'));
    for (const [action, who] of [
      ['accept', 'owner'],
      ['decline', 'owner'],
      ['cancel', 'renter'],
    ] as const) {
      expect(code(() => assertTransition(stale, action, who, BEFORE))).toBe('409 rentals.expired');
    }
  });

  it('an already-persisted expired rental is rejected too', () => {
    expect(code(() => assertTransition(rental('expired'), 'accept', 'owner', BEFORE))).toBe(
      '409 rentals.expired',
    );
  });
});
