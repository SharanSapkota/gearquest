import { describe, expect, it } from 'vitest';
import { MAX_IMAGE_BYTES } from '@gearshare/shared';
import { CloudinaryProvider } from './cloudinary.provider';
import { createUploadsService } from './uploads.service';

const provider = (uploadPreset?: string) =>
  new CloudinaryProvider({ cloudName: 'demo', apiKey: 'key', apiSecret: 'shh-secret', uploadPreset });

describe('uploads service', () => {
  it('returns a signed payload restricted to images, with the size limit', () => {
    const res = createUploadsService(provider()).sign();
    expect(res).toMatchObject({
      cloudName: 'demo',
      apiKey: 'key',
      folder: 'gear',
      allowedFormats: 'jpg,jpeg,png,webp',
      maxBytes: MAX_IMAGE_BYTES,
    });
    expect(res.signature).toMatch(/^[0-9a-f]{40}$/);
    expect(res).not.toHaveProperty('uploadPreset');
  });

  it('never leaks the API secret', () => {
    expect(JSON.stringify(createUploadsService(provider()).sign())).not.toContain('shh-secret');
  });

  it('is deterministic for a given timestamp and covers the preset when configured', () => {
    const now = () => 1_700_000_000_000;
    const a = provider().signUpload(now);
    const b = provider().signUpload(now);
    const c = provider('preset').signUpload(now);
    expect(a.signature).toBe(b.signature);
    expect(a.timestamp).toBe(1_700_000_000);
    expect(c.uploadPreset).toBe('preset');
    expect(c.signature).not.toBe(a.signature);
  });
});
