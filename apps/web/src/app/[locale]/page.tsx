import { getTranslations, setRequestLocale } from 'next-intl/server';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/format';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const gear = await api.listGear().catch(() => null);

  return (
    <main>
      <h1>{t('home.title')}</h1>
      {gear === null ? (
        <p>{t('errors.loadFailed')}</p>
      ) : gear.length === 0 ? (
        <p>{t('home.empty')}</p>
      ) : (
        <ul>
          {gear.map((g) => (
            <li key={g.id}>
              {g.title} · {g.city}
              {g.pricing.dailyCents !== undefined && ` · ${formatMoney(g.pricing.dailyCents, locale)}`}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
