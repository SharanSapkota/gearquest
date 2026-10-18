import cookieParser from 'cookie-parser';
import express from 'express';
import request from 'supertest';
import { completeSignupSchema, googleLoginSchema } from '@gearshare/shared';
import { describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../../middleware/errorHandler';
import { validateBody } from '../../middleware/validate';
import type { UserRecord } from '../users/users.repository';
import { createAuthController } from './auth.controller';
import { createAuthService } from './auth.service';

const claims = { sub: 'g1', email: 'a@example.com', email_verified: true, name: 'Anna', picture: 'https://img/a.png' };
const user = {
  _id: '65a000000000000000000001',
  googleId: 'g1',
  email: 'a@example.com',
  name: 'Anna',
  language: 'fi',
  role: 'renter',
  ratingAvg: 0,
  ratingCount: 0,
  termsAcceptedAt: new Date(),
} as unknown as UserRecord;

// The real router wiring minus Mongo: same controller, same validation, a mocked repository.
function setup(existing: UserRecord | null) {
  const repo = {
    findByGoogleId: vi.fn().mockResolvedValue(existing),
    createFromGoogle: vi.fn().mockResolvedValue(user),
    findById: vi.fn().mockResolvedValue(user),
  };
  const service = createAuthService(repo, vi.fn().mockResolvedValue(claims), 'test-secret-test-secret-test-secret');
  const controller = createAuthController(service, { getMe: vi.fn() });
  const app = express();
  app.use(express.json(), cookieParser());
  app.post('/auth/google', validateBody(googleLoginSchema), controller.google);
  app.get('/auth/signup/pending', controller.pendingSignup);
  app.post('/auth/signup/complete', validateBody(completeSignupSchema), controller.completeSignup);
  app.use(errorHandler);
  return { app, repo };
}

const setCookies = (res: request.Response) => (res.headers['set-cookie'] as unknown as string[] | undefined) ?? [];
const cookieValue = (res: request.Response, name: string) =>
  setCookies(res).find((c) => c.startsWith(`${name}=`))?.split(';')[0]?.slice(name.length + 1);

describe('auth controller: cookies', () => {
  it('signin for an unknown account: httpOnly signup cookie, no session, no token in the body', async () => {
    const { app, repo } = setup(null);
    const res = await request(app).post('/auth/google').send({ idToken: 't', intent: 'signin' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'NEW_USER', profile: { name: 'Anna', avatarUrl: 'https://img/a.png' } });
    const signup = setCookies(res).find((c) => c.startsWith('gs_signup='));
    expect(signup).toMatch(/HttpOnly/i);
    expect(signup).toMatch(/Max-Age=600/);
    expect(setCookies(res).some((c) => c.startsWith('gs_session='))).toBe(false);
    expect(JSON.stringify(res.body)).not.toContain(cookieValue(res, 'gs_signup') as string);
    expect(repo.createFromGoogle).not.toHaveBeenCalled();
  });

  it('signin for an existing account sets the session cookie and returns the dashboard path', async () => {
    const { app } = setup(user);
    const res = await request(app).post('/auth/google').send({ idToken: 't', intent: 'signin' });
    expect(res.body).toMatchObject({ status: 'OK', dashboardPath: '/dashboard/renter', isNew: false });
    expect(res.body).not.toHaveProperty('token');
    expect(setCookies(res).find((c) => c.startsWith('gs_session='))).toMatch(/HttpOnly/i);
  });

  it('completes the signup from the cookie: creates the user, sets the session, clears the signup cookie', async () => {
    const { app, repo } = setup(null);
    const first = await request(app).post('/auth/google').send({ idToken: 't', intent: 'signin' });
    const cookie = `gs_signup=${cookieValue(first, 'gs_signup')}`;

    const pending = await request(app).get('/auth/signup/pending').set('Cookie', cookie);
    expect(pending.body).toEqual({ name: 'Anna', avatarUrl: 'https://img/a.png' });

    const done = await request(app)
      .post('/auth/signup/complete')
      .set('Cookie', cookie)
      .send({ role: 'renter', termsAccepted: true });
    expect(done.status).toBe(201);
    expect(repo.createFromGoogle).toHaveBeenCalledOnce();
    expect(setCookies(done).find((c) => c.startsWith('gs_session='))).toMatch(/HttpOnly/i);
    expect(setCookies(done).find((c) => c.startsWith('gs_signup='))).toMatch(/Expires=Thu, 01 Jan 1970/);
  });

  it('rejects a missing or forged signup cookie, and never trusts identity from the body', async () => {
    const { app, repo } = setup(null);
    const noCookie = await request(app).post('/auth/signup/complete').send({ role: 'renter', termsAccepted: true });
    expect(noCookie.status).toBe(401);
    expect(noCookie.body).toEqual({ error: 'auth.signupTokenInvalid' });
    const forged = await request(app)
      .post('/auth/signup/complete')
      .set('Cookie', 'gs_signup=forged')
      .send({ role: 'renter', termsAccepted: true, email: 'evil@example.com', googleId: 'x' });
    expect(forged.status).toBe(401);
    expect(repo.createFromGoogle).not.toHaveBeenCalled();
  });

  it('signup intent requires signupData', async () => {
    const { app } = setup(null);
    const res = await request(app).post('/auth/google').send({ idToken: 't', intent: 'signup' });
    expect(res.status).toBe(400);
  });

  it('signup without accepted terms is a 403 and sets no cookie', async () => {
    const { app } = setup(null);
    const res = await request(app)
      .post('/auth/google')
      .send({ idToken: 't', intent: 'signup', signupData: { role: 'renter', termsAccepted: false } });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'auth.termsRequired' });
    expect(setCookies(res)).toHaveLength(0);
  });
});
