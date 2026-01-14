
import { setRequestLocale } from 'next-intl/server';
import { locales, type Locale } from '@/i18n/config';
import FeaturesShowcase from '@/components/features/FeaturesShowcase';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function FeaturesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const validLocale = locales.includes(locale as Locale) ? locale as Locale : 'en';
  setRequestLocale(validLocale);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <Navbar />
      <FeaturesShowcase />
      <Footer />
    </div>
  );
}
