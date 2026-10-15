import { env } from '../../config/env';
import { CloudinaryProvider } from './cloudinary.provider';

export const cloudinaryProvider = new CloudinaryProvider({
  cloudName: env.CLOUDINARY_CLOUD_NAME,
  apiKey: env.CLOUDINARY_API_KEY,
  apiSecret: env.CLOUDINARY_API_SECRET,
  uploadPreset: env.CLOUDINARY_UPLOAD_PRESET,
});
