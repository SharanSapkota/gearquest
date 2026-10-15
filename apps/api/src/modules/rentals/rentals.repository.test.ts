import { describe, expect, it } from 'vitest';
import { buildMineQuery, buildOverlapQuery } from './rentals.repository';

const NOW = new Date('2026-06-01T10:00:00Z');

describe('buildOverlapQuery', () => {
  const start = new Date('2026-06-05T00:00:00Z');
  const end = new Date('2026-06-07T00:00:00Z');

  it('only considers ACCEPTED rentals, so pending requests never block', () => {
    expect(buildOverlapQuery('g1', start, end).status).toBe('accepted');
  });

  it('uses half-open ranges: existing.start < end and existing.end > start', () => {
    expect(buildOverlapQuery('g1', start, end)).toMatchObject({
      gearId: 'g1',
      startAt: { $lt: end },
      endAt: { $gt: start },
    });
  });
});

describe('buildMineQuery', () => {
  it('scopes by role', () => {
    expect(buildMineQuery('u1', { role: 'owner' }, NOW)).toEqual({ ownerId: 'u1' });
    expect(buildMineQuery('u1', { role: 'renter' }, NOW)).toEqual({ renterId: 'u1' });
  });

  it('requested excludes stale requests', () => {
    expect(buildMineQuery('u1', { role: 'owner', status: 'requested' }, NOW)).toEqual({
      ownerId: 'u1',
      status: 'requested',
      expiresAt: { $gt: NOW },
    });
  });

  it('expired includes stale requests that the sweep has not rewritten yet', () => {
    expect(buildMineQuery('u1', { role: 'renter', status: 'expired' }, NOW)).toEqual({
      renterId: 'u1',
      $or: [{ status: 'expired' }, { status: 'requested', expiresAt: { $lte: NOW } }],
    });
  });

  it('other statuses filter directly', () => {
    expect(buildMineQuery('u1', { role: 'owner', status: 'accepted' }, NOW)).toEqual({
      ownerId: 'u1',
      status: 'accepted',
    });
  });
});
