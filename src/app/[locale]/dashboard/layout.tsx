
import { ReactNode } from 'react';
import { MainNavigation } from '../../components/main-navigation';

interface DashboardLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function DashboardLayout({
  children,
  params
}: DashboardLayoutProps) {
  const { locale } = await params;
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="fixed top-0 left-0 right-0 z-50">
        <MainNavigation serverLocale={locale} />
      </div>
      <main className="pt-16 pb-8" dir={direction}>
        {children}
      </main>
    </div>
  );
}
