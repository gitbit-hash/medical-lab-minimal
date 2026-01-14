'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Globe, ChevronDown } from 'lucide-react';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function Navbar() {
  const t = useTranslations('Navigation');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  const navItems = [
    { href: `/${locale}`, label: t('home') },
    { href: `/${locale}#features`, label: t('features') },
    { href: `/${locale}/features`, label: 'Screenshots' },
    { href: `/${locale}#pricing`, label: t('pricing') },
  ];

  const switchLanguage = (newLocale: Locale) => {
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    window.location.href = newPathname || `/${newLocale}`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/100 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="Lab Logo"
              width={300}
              height={100}
              className="h-10 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              priority
            />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-slate-300 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <button onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 dark:text-slate-600 hover:bg-blue-600 dark:hover:bg-blue-400 transition-colors">
                <Globe className="w-4 h-4" />
                <span className="text-sm">{localeNames[locale]}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isLanguageDropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-100 rounded-lg shadow-lg border border-slate-200 dark:border-slate-300 py-1 overflow-hidden">
                    {locales.map((loc) => (
                      <button key={loc} onClick={() => { switchLanguage(loc); setIsLanguageDropdownOpen(false); }} className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-300 transition-colors ${loc === locale ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-100 dark:text-slate-600'}`}>
                        {localeNames[loc]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link href={`/${locale}/login`} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">{t('login')}</Link>
            <Link href={`/${locale}/signup`} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40">{t('demo')}</Link>
          </div>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="px-4 py-4 space-y-3">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">{item.label}</Link>
              ))}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-3">
                <div className="grid grid-cols-2 gap-2 px-4">
                  {locales.map((loc) => (
                    <button key={loc} onClick={() => { switchLanguage(loc); setIsMobileMenuOpen(false); }} className={`px-3 py-2 rounded-lg text-sm text-center ${loc === locale ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-600 font-medium' : 'bg-slate-100 dark:bg-slate-800 text-red-300 dark:text-slate-600'}`}>{localeNames[loc]}</button>
                  ))}
                </div>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-3 space-y-2">
                <Link href={`/${locale}/login`} onClick={() => setIsMobileMenuOpen(false)} className="block w-full px-4 py-2.5 text-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-600">{t('login')}</Link>
                <Link href={`/${locale}/signup`} onClick={() => setIsMobileMenuOpen(false)} className="block w-full px-4 py-2.5 text-center rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium">{t('demo')}</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
