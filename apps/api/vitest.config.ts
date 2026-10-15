import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // env.ts validates process.env on import, so tests that load the app need these.
    env: {
      MONGODB_URI: 'mongodb://localhost:27017/test',
      JWT_SECRET: 'test-secret-test-secret-test-secret',
      GOOGLE_CLIENT_ID: 'test-client-id',
      CLOUDINARY_CLOUD_NAME: 'test-cloud',
      CLOUDINARY_API_KEY: 'test-key',
      CLOUDINARY_API_SECRET: 'test-secret',
    },
  },
});
