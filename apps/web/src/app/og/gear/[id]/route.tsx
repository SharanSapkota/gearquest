import { getTranslations } from 'next-intl/server';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { ogCard } from '@/lib/seo/ogCard';
import { LOCALE_LIST, type SeoLocale } from '@/lib/seo/routes';

// Public listing data only: title, photo, price, city. Never owner contact or exact location.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raw = new URL(request.url).searchParams.get('locale');
  const locale = (LOCALE_LIST as readonly string[]).includes(raw ?? '') ? (raw as SeoLocale) : 'fi';
  const gear = await api.getGear(id).catch(() => null);
  if (!gear || gear.status !== 'active') return new Response(null, { status: 404 });
  const t = await getTranslations({ locale });
  const { hourlyCents, dailyCents } = gear.pricing;
  const price =
    dailyCents !== undefined
      ? t('gear.perDay', { price: formatMoney(dailyCents, locale) })
      : hourlyCents !== undefined
        ? t('gear.perHour', { price: formatMoney(hourlyCents, locale) })
        : undefined;
  return ogCard({
    heading: gear.title,
    sub: `${t(`categories.${gear.category}`)} · ${gear.city}`,
    price,
    photo: gear.images[0],
  });
}
