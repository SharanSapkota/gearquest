import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  GOOGLE_CLIENT_ID: z.string().min(1),
  // Read only to warn about a mismatch with GOOGLE_CLIENT_ID when both come from the root .env.
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
  NODE_ENV: z.string().default('development'),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  // Optional signed preset; set a max file size on it in Cloudinary to enforce the 5 MB limit server-side.
  CLOUDINARY_UPLOAD_PRESET: z.string().min(1).optional(),
});

// Names only, never values: these messages end up in terminals and logs.
export function describeEnvIssues(error: z.ZodError): string {
  const lines = error.issues.map((issue) => {
    const name = String(issue.path[0]);
    return issue.code === 'invalid_type' ? `  ${name}: missing` : `  ${name}: invalid (${issue.message})`;
  });
  return [
    'Invalid API environment:',
    ...lines,
    'Copy .env.example to .env in the repository root and fill in the values.',
  ].join('\n');
}

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(describeEnvIssues(parsed.error));
    process.exit(1);
  }
  const { GOOGLE_CLIENT_ID, NEXT_PUBLIC_GOOGLE_CLIENT_ID } = parsed.data;
  if (NEXT_PUBLIC_GOOGLE_CLIENT_ID && NEXT_PUBLIC_GOOGLE_CLIENT_ID !== GOOGLE_CLIENT_ID) {
    console.warn(
      'GOOGLE_CLIENT_ID and NEXT_PUBLIC_GOOGLE_CLIENT_ID differ: Google sign-in will fail with an audience mismatch.',
    );
  }
  return parsed.data;
}

export const env = loadEnv();
