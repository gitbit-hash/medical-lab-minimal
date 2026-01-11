// app/[locale]/layout.tsx
import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { MainNavigation } from '../components/main-navigation';

const locales = ['en', 'ar', 'fr', 'es'] as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params
}: LocaleLayoutProps) {
  const session = await getServerSession(authOptions);
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  let messages;
  try {
    messages = (await import(`../../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for ${locale}:`, error);
    notFound();
  }

  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    // Remove html and body tags since they're in root layout
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
        <div className="fixed top-0 left-0 right-0 z-50">
          <MainNavigation serverLocale={locale} />
        </div>
        <main className="pt-16 pb-8" dir={direction}>
          {children}
        </main>
      </div>
    </NextIntlClientProvider>
  );
}