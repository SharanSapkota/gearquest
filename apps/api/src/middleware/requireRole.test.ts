import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { createRequireOwner } from './requireRole';

const run = async (role: string | undefined, user: { id: string } | null = { id: 'u1' }) => {
  const findById = vi.fn().mockResolvedValue(role === undefined ? { _id: 'u1' } : { _id: 'u1', role });
  const next = vi.fn();
  let result: { status: number; code: string } | null = null;
  try {
    await createRequireOwner({ findById } as never)({ user: user ?? undefined } as Request, {} as Response, next);
  } catch (err) {
    result = err as { status: number; code: string };
  }
  return { next, result, findById };
};

describe('requireRole("owner")', () => {
  it.each(['owner', 'both'])('lets %s through', async (role) => {
    const { next, result } = await run(role);
    expect(result).toBeNull();
    expect(next).toHaveBeenCalledOnce();
  });

  it.each(['renter', undefined])('blocks role %s with ROLE_REQUIRED', async (role) => {
    const { next, result } = await run(role);
    expect(result).toMatchObject({ status: 403, code: 'ROLE_REQUIRED' });
    expect(next).not.toHaveBeenCalled();
  });

  it('blocks a user that no longer exists', async () => {
    const next = vi.fn();
    const mw = createRequireOwner({ findById: vi.fn().mockResolvedValue(null) } as never);
    await expect(mw({ user: { id: 'u1' } } as Request, {} as Response, next)).rejects.toMatchObject({
      code: 'ROLE_REQUIRED',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('requires a signed-in user and loads the role from the repository, not the request', async () => {
    const missing = await run('owner', null);
    expect(missing.result).toMatchObject({ status: 401 });
    const { findById } = await run('owner');
    expect(findById).toHaveBeenCalledWith('u1');
  });
});
