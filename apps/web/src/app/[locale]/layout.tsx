import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { BottomTabs } from '@/components/layout/BottomTabs';
import { Header } from '@/components/layout/Header';
import { ToastProvider } from '@/components/ui/Toast';
import { routing } from '@/i18n/routing';
import { api } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import '../globals.css';

// latin-ext covers å, ä, ö and the rest of the Nordic alphabet.
const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-inter', display: 'swap' });
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-jakarta',
  display: 'swap',
});

// viewport-fit=cover lets the layout use the iOS safe-area insets.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#fffaf5',
};

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
    <html lang={locale} className={`${inter.variable} ${jakarta.variable}`}>
      <body>
        <NextIntlClientProvider>
          <AuthProvider user={user}>
            <ToastProvider>
              <Header pendingCount={pendingCount} />
              {children}
              <Suspense fallback={null}>
                <BottomTabs pendingCount={pendingCount} />
              </Suspense>
            </ToastProvider>
          </AuthProvider>
        </NextIntlClientProvider>
        <footer className="footer">
          <p>{t('disclaimer')}</p>
        </footer>
      </body>
    </html>
  );
}
