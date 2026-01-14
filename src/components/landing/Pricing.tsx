'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import type { Locale } from '@/i18n/config';

const plans = ['starter', 'professional', 'enterprise'] as const;

export default function Pricing() {
  const t = useTranslations('Landing.pricing');
  const locale = useLocale() as Locale;
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    let currencyCode = 'USD';
    let localeCode = 'en-US';

    if (currency === 'EGP') {
      currencyCode = 'EGP';
      localeCode = 'ar-EG';
    } else if (currency === 'USD') {
      currencyCode = 'USD';
      localeCode = 'en-US';
    } else if (currency === 'EUR') {
      currencyCode = 'EUR';
      localeCode = locale === 'es' ? 'es-ES' : 'fr-FR';
    }

    return new Intl.NumberFormat(localeCode, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  // Function to determine if a feature is negative (starts with "لا")
  const isNegativeFeature = (feature: string) => {
    return feature.trim().startsWith('لا');
  };

  // Function to remove "لا" prefix from features
  const formatFeatureText = (feature: string) => {
    if (feature.trim().startsWith('لا')) {
      return feature.replace(/^لا\s*/, '').trim();
    }
    return feature;
  };

  // Render price for Arabic locale
  const renderArabicPrice = (plan: string) => {
    if (plan === 'starter') {
      return (
        <div className="flex flex-col gap-1">
          <span className="text-lg font-semibold">من داخل مصر {formatCurrency(1200, 'EGP')}</span>
          <span className="text-lg font-semibold">من خارج مصر {formatCurrency(50, 'USD')}</span>
        </div>
      );
    }
    if (plan === 'professional') {
      return (
        <div className="flex flex-col gap-1">
          <span className="text-lg font-semibold">من داخل مصر {formatCurrency(2500, 'EGP')}</span>
          <span className="text-lg font-semibold">من خارج مصر {formatCurrency(90, 'USD')}</span>
        </div>
      );
    }
    return null;
  };

  // Render price for other locales
  const renderStandardPrice = (plan: string) => {
    if (plan === 'enterprise') {
      return <span>{t("enterprisePrice")}</span>;
    }
    return formatCurrency(Number(t(`${plan}.price`)), locale === 'ar' ? 'EGP' : locale === 'en' ? 'USD' : 'EUR');
  };

  return (
    <section id="pricing" className="py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" dir={direction}>
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-3xl md:text-4xl text-center font-bold text-slate-900 dark:text-white mb-4">{t('title')}</motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="text-lg text-slate-600 dark:text-slate-400">{t('subtitle')}</motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const isProfessional = plan === 'professional';
            const isEnterprise = plan === 'enterprise';
            const isStarter = plan === 'starter';

            const features = t.raw(`${plan}.features`) as string[];
            return (
              <motion.div key={plan} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} className={`relative rounded-2xl p-8 ${isProfessional ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-xl shadow-blue-500/25 scale-105' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>
                {isProfessional && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-yellow-900 text-sm font-semibold rounded-full">{t(`${plan}.popular`)}</div>}
                <h3 className={`text-xl font-semibold mb-2 ${isProfessional ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{t(`${plan}.name`)}</h3>
                <p className={`text-sm mb-4 ${isProfessional ? 'text-blue-100' : 'text-slate-600 dark:text-slate-400'}`}>{t(`${plan}.description`)}</p>
                <div className="mb-6">
                  <div className={`${isProfessional ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {locale === 'ar' && (plan === 'starter' || plan === 'professional') ? (
                      renderArabicPrice(plan)
                    ) : (
                      <span className="text-4xl font-bold">
                        {renderStandardPrice(plan)}
                      </span>
                    )}
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {features.map((feature, i) => {
                    // Check if this is a negative feature (only for starter plan)
                    const isNegative = isStarter && isNegativeFeature(feature);
                    const featureText = formatFeatureText(feature);

                    return (
                      <li key={i} className="flex items-start gap-3">
                        {isNegative ? (
                          // Show X icon for negative features in starter plan
                          <X className="w-5 h-5 flex-shrink-0 text-red-500 dark:text-red-400" />
                        ) : (
                          // Show check icon for positive features
                          <Check className={`w-5 h-5 flex-shrink-0 ${isProfessional ? 'text-blue-200' : 'text-green-500'}`} />
                        )}
                        <span className={`text-sm ${isProfessional ? 'text-white' : 'text-slate-600 dark:text-slate-400'} ${isNegative ? 'opacity-70' : ''}`}>
                          {featureText}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <Link href={plan === 'enterprise' ? `/${locale}#contact` : `/${locale}/signup`} className={`block w-full py-3 rounded-xl font-semibold text-center transition-all ${isProfessional ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'}`}>{t(`${plan}.cta`)}</Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
