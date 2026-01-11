// app/admin/layout.tsx
import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from '@/app/api/auth/auth-options';
import { getTranslations } from 'next-intl/server';
import Link from "next/link";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

// Define the locales your app supports
const locales = ['en', 'ar', 'fr', 'es'] as const;

interface AdminLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Redirect if not SuperAdmin
  if (!session || session.user?.role !== "SuperAdmin") {
    redirect('/');
  }

  const t = await getTranslations('AdminLayout');
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  const navigation = [
    { name: t('nav.dashboard'), href: '/admin', icon: '📊' },
    { name: t('nav.manageAdmins'), href: '/admin/users', icon: '👥' },
    { name: t('nav.auditLogs'), href: '/admin/audit-logs', icon: '📝' },
    { name: t('nav.discountSettings'), href: '/admin/discount-settings', icon: '💰' },
    { name: t('nav.pdfSettings'), href: '/admin/pdf-settings', icon: '📄' },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir={direction}>
      {/* Compact Horizontal Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md border-b border-gray-200 z-40">
        <div className={`flex items-center justify-between px-4 py-3 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
          {/* Left: Brand and Navigation */}
          <div className={`flex items-center space-x-6 ${direction === 'rtl' ? 'space-x-reverse' : ''}`}>
            {/* Brand */}
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs">🛠</span>
              </div>
              <h1 className="text-base font-bold text-gray-800 hidden sm:block">{t('brand')}</h1>
            </div>

            {/* Navigation Links */}
            <nav className="flex items-center space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={`/${locale}${item.href}`}
                  className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <span>{item.icon}</span>
                  <span className="hidden md:inline">{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: User Info */}
          <div className={`flex items-center space-x-3 ${direction === 'rtl' ? 'space-x-reverse' : ''}`}>
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
              <p className="text-xs text-gray-500">{t('superAdminRole')}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-xs">
                {session.user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Adjusted for compact top bar */}
      <div className="pt-16">
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}