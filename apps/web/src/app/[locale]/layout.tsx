import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Header } from '@/components/layout/Header';
import { routing } from '@/i18n/routing';
import { api } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('legal');
  const user = await getCurrentUser();
  const pendingCount = user ? await api.countPendingRequests() : 0;

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <AuthProvider user={user}>
            <Header pendingCount={pendingCount} />
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
        <footer className="footer">
          <p>{t('disclaimer')}</p>
        </footer>
      </body>
    </html>
  );
}
