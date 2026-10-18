import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  GOOGLE_CLIENT_ID: z.string().min(1),
  NODE_ENV: z.string().default('development'),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  // Optional signed preset; set a max file size on it in Cloudinary to enforce the 5 MB limit server-side.
  CLOUDINARY_UPLOAD_PRESET: z.string().min(1).optional(),
});

// Names only, never values: this message ends up in terminals and logs.
export function describeEnvError(error: z.ZodError): string {
  const names = [...new Set(error.issues.map((i) => String(i.path[0])))];
  return [
    `Invalid or missing environment variables: ${names.join(', ')}.`,
    'Copy .env.example to .env at the repo root and fill in the values (pnpm dev loads it).',
  ].join('\n');
}

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) throw new Error(describeEnvError(result.error));
  return result.data;
}

export const env = parseEnv();
