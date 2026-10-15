import { v2 as cloudinary } from 'cloudinary';
import { GEAR_IMAGE_FOLDER, IMAGE_FORMATS, MAX_IMAGE_BYTES, type UploadSignature } from '@gearshare/shared';

export type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset?: string;
};

// Signs upload parameters for direct browser-to-Cloudinary uploads. The API secret never leaves here.
export class CloudinaryProvider {
  constructor(private readonly config: CloudinaryConfig) {}

  get cloudName() {
    return this.config.cloudName;
  }

  signUpload(now: () => number = Date.now): UploadSignature {
    const timestamp = Math.floor(now() / 1000);
    const allowedFormats = IMAGE_FORMATS.join(',');
    const { uploadPreset } = this.config;
    const params = {
      timestamp,
      folder: GEAR_IMAGE_FOLDER,
      allowed_formats: allowedFormats,
      ...(uploadPreset && { upload_preset: uploadPreset }),
    };
    return {
      cloudName: this.config.cloudName,
      apiKey: this.config.apiKey,
      timestamp,
      signature: cloudinary.utils.api_sign_request(params, this.config.apiSecret),
      folder: GEAR_IMAGE_FOLDER,
      allowedFormats,
      ...(uploadPreset && { uploadPreset }),
      maxBytes: MAX_IMAGE_BYTES,
    };
  }
}
