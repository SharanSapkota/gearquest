import type { CloudinaryProvider } from './cloudinary.provider';

export function createUploadsService(provider: Pick<CloudinaryProvider, 'signUpload'>) {
  return {
    sign() {
      return provider.signUpload();
    },
  };
}
