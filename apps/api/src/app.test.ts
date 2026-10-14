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
