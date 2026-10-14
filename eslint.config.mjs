import js from '@eslint/js';
import nextVitals from 'eslint-config-next/core-web-vitals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/next-env.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...nextVitals.map((c) => ({ ...c, files: ['apps/web/**/*.{ts,tsx}'] })),
  { files: ['apps/web/**'], settings: { next: { rootDir: 'apps/web' } } },
);
