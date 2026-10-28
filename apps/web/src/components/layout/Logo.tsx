import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

// Glyph: a compass ring with a mountain ridge inside. Single colour (currentColor), so it reads on
// white (green) and on dark green (white). Drawn on a 24px grid with a 2px stroke to stay crisp small.
export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      className="logo__glyph"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M6.5 16.5 10.8 9.5l2.6 4.2 1.6-2.3 3 5.1z" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  const t = useTranslations('app');
  return (
    <Link href="/" className={light ? 'logo logo--light' : 'logo'} aria-label={t('name')}>
      <LogoMark />
      <span className="logo__word">{t('name')}</span>
    </Link>
  );
}
