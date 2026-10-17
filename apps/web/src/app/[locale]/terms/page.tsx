import { getTranslations, setRequestLocale } from 'next-intl/server';

// Placeholder until the reviewed legal text is ready.
export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('legalPages.terms');
  return (
    <main className="page page--narrow">
      <h1>{t('title')}</h1>
      <p>{t('body')}</p>
    </main>
  );
}
