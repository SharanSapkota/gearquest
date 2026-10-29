import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buttonClass } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'gone' });
  return { title: t('title'), robots: { index: false, follow: false } };
}

// Shown for removed listings. proxy.ts rewrites gear URLs here with HTTP status 410.
export default async function GonePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('gone');
  return (
    <main className="page page--narrow">
      <h1>{t('title')}</h1>
      <p>{t('body')}</p>
      <Link href="/" className={buttonClass()}>
        {t('browse')}
      </Link>
    </main>
  );
}
