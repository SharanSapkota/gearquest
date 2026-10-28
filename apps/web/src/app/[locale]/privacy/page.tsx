import { getTranslations, setRequestLocale } from 'next-intl/server';
import { staticPageMetadata } from '@/lib/seo/staticMetadata';

export const generateMetadata = staticPageMetadata('privacy', 'legalPages.privacyTitle', 'privacyDescription');

// Placeholder until the lawyer-reviewed text is ready.
export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  return (
    <main className="page page--narrow">
      <h1>{t('legalPages.privacyTitle')}</h1>
      <p>{t('legalPages.placeholder')}</p>
      <p>{t('legal.disclaimer')}</p>
    </main>
  );
}
