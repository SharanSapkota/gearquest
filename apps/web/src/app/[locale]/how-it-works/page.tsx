import { ContentPageView } from '@/components/seo/ContentPageView';
import { contentMetadata } from '@/lib/seo/contentMetadata';
import { isSeoLocale } from '@/lib/seo/routes';
import { notFound } from 'next/navigation';

export const generateMetadata = contentMetadata('howItWorks');

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSeoLocale(locale)) notFound();
  return <ContentPageView pageKey="howItWorks" locale={locale} />;
}
