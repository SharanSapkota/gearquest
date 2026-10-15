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

export const env = envSchema.parse(process.env);
