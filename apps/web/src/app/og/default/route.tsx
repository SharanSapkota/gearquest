import { getTranslations } from 'next-intl/server';
import { ogCard } from '@/lib/seo/ogCard';
import { LOCALE_LIST, type SeoLocale } from '@/lib/seo/routes';

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get('locale');
  const locale = (LOCALE_LIST as readonly string[]).includes(raw ?? '') ? (raw as SeoLocale) : 'fi';
  const t = await getTranslations({ locale, namespace: 'seo' });
  return ogCard({ heading: 'GearQuest', sub: t('ogTagline') });
}
