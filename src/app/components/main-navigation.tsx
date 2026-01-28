// app/components/main-navigation.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { LogoutButton } from './logout-button';
import { useSession } from "next-auth/react";
import { useState, useEffect } from 'react';
import Image from 'next/image';

import {
  TbLayoutDashboard,
  TbUsers,
  TbMenu2,
  TbX
} from 'react-icons/tb';

interface MainNavigationProps {
  serverLocale: string;
}

export function MainNavigation({ serverLocale }: MainNavigationProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const t = useTranslations('Navigation');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (status === 'loading') return null;
  if (!session) return null;

  const navigation = [
    { name: t('dashboard'), href: '/', icon: TbLayoutDashboard },
    { name: t('patients'), href: '/patients', icon: TbUsers },
  ];

  const isRTL = locale === 'ar';
  const direction = mounted ? (isRTL ? 'rtl' : 'ltr') : (serverLocale === 'ar' ? 'rtl' : 'ltr');

  const isActive = (href: string) => {
    const localeHref = `/${locale}${href === '/' ? '' : href}`;
    if (href === '/') {
      return pathname === `/${locale}` || pathname === '/';
    }
    return pathname.startsWith(localeHref);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200 z-50 transition-all duration-300"
      dir={direction}
    >
      <div className="max-w-7xl  px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center">
            <Link href={`/${locale}`} className="flex items-center group focus:outline-none">
              <Image
                src="/logos/logo_7a21bc67_colored_logo_whats_modified.png"
                alt="Lab Logo"
                width={300}
                height={100}
                className="h-10 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center justify-center flex-1 mx-4">
            <div className="flex items-center gap-1">
              {navigation.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={`/${locale}${item.href}`}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap border border-transparent ${isActive(item.href)
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="hidden xl:inline">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">

            {/* User Info */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex flex-col items-end">
                <p className="text-sm font-semibold text-gray-900 leading-tight">{session.user?.name}</p>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{session.user?.role}</p>
              </div>

              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-sm ring-2 ring-white">
                <span className="text-sm font-bold">
                  {session.user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Desktop Logout Button */}
            <div className="hidden md:block">
              <LogoutButton />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <TbX className="w-6 h-6" />
              ) : (
                <TbMenu2 className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        className={`lg:hidden bg-white border-t border-gray-100 shadow-xl overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-[85vh] opacity-100' : 'max-h-0 opacity-0'
          }`}
        dir={direction}
      >
        <div className="px-4 pt-2 pb-6 space-y-1">
          {/* Nav Links */}
          <div className="space-y-1">
            {navigation.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.name}
                  href={`/${locale}${item.href}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`group flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl transition-all duration-200 ${isActive(item.href)
                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <div className={`p-1.5 rounded-lg ${isActive(item.href) ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Mobile User Info & Logout */}
          <div className="border-t border-gray-200 mt-4 pt-4">
            <div className="flex items-center gap-3 px-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white">
                <span className="text-base font-bold">
                  {session.user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-bold text-gray-900">{session.user?.name}</p>
                <p className="text-xs text-gray-500">{session.user?.role}</p>
              </div>
            </div>

            {/* Full width Logout Button */}
            <div className="w-full">
              <LogoutButton className="w-full" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}