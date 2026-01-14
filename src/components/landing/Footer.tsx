'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import type { Locale } from '@/i18n/config';

export default function Footer() {
  const t = useTranslations('Footer');
  const locale = useLocale() as Locale;
  const direction = locale === 'ar' ? 'rtl' : 'ltr';
  const productLinks = [
    { href: `/${locale}#features`, label: t('features') },
    { href: `/${locale}#pricing`, label: t('pricing') },
    { href: `/${locale}/signup`, label: t('demo') },
  ];

  const companyLinks = [
    { href: `/${locale}/about`, label: t('about') },
    { href: `/${locale}/contact`, label: t('contact') },
  ];

  const legalLinks = [
    { href: `/${locale}/privacy`, label: t('privacy') },
    { href: `/${locale}/terms`, label: t('terms') },
  ];

  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" dir={direction}>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2">
            <Link href={`/${locale}`} className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-xl font-bold text-white">LapManagerPro</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">{t('description')}</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t('product')}</h4>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}><Link href={link.href} className="text-sm hover:text-white transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t('company')}</h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}><Link href={link.href} className="text-sm hover:text-white transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t('legal')}</h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}><Link href={link.href} className="text-sm hover:text-white transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm">{t('copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
