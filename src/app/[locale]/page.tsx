
import { setRequestLocale } from 'next-intl/server';
import { locales, type Locale } from '@/i18n/config';
import LandingPage from '@/components/landing/LandingPage';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const validLocale = locales.includes(locale as Locale) ? locale as Locale : 'en';
  setRequestLocale(validLocale);
  return <LandingPage />;
}