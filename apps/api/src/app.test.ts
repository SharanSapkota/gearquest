import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';

describe('app', () => {
  it('responds to health check', async () => {
    const res = await request(createApp('http://localhost:3000')).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe('auth', () => {
  it('rejects unauthenticated access to protected routes', async () => {
    const app = createApp('http://localhost:3000');
    expect((await request(app).get('/api/v1/auth/me')).status).toBe(401);
    expect((await request(app).patch('/api/v1/users/me').send({})).status).toBe(401);
    expect((await request(app).get('/api/v1/gear/mine')).status).toBe(401);
    expect((await request(app).post('/api/v1/uploads/sign')).status).toBe(401);
    const bad = await request(app).get('/api/v1/auth/me').set('Cookie', 'gs_session=garbage');
    expect(bad.status).toBe(401);
  });

  it('logout clears the cookie', async () => {
    const res = await request(createApp('http://localhost:3000')).post('/api/v1/auth/logout');
    expect(res.status).toBe(204);
    expect(String(res.headers['set-cookie'])).toContain('gs_session=;');
  });
});
