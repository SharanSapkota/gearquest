import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

// Wordmark: a tent-and-ridge glyph in a forest tile, set in the display face.
export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      className="logo__glyph"
      width={size}
      height={size}
      viewBox="0 0 34 34"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="34" height="34" rx="11" fill="currentColor" />
      <path
        d="M5 25.5 12.6 12l4 6.4 3-4.2L29 25.5z"
        fill="none"
        stroke="var(--on-forest)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="24.5" cy="9" r="2.2" fill="var(--primary-400)" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  const t = useTranslations('app');
  return (
    <Link href="/" className={light ? 'logo logo--light' : 'logo'}>
      <LogoMark />
      <span className="logo__word">{t('name')}</span>
    </Link>
  );
}
