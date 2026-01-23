'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, X, Cloud } from 'lucide-react';
import type { Locale } from '@/i18n/config';

const plans = ['starter', 'professional', 'enterprise', 'cloud'] as const;

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
    if (plan === 'cloud') {
      return (
        <div className="flex flex-col gap-1">
          <span className="text-lg font-semibold">{formatCurrency(600, 'EGP')}{t('cloud.period')}</span>
          <span className="text-lg font-semibold">من خارج مصر {formatCurrency(19, 'USD')}{t('cloud.period')}</span>
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
    if (plan === 'cloud') {
      const price = Number(t('cloud.price'));
      const priceMiddleEast = Number(t('cloud.priceMiddleEast'));
      const period = t('cloud.period');

      // Show both prices if different
      if (price !== priceMiddleEast) {
        return (
          <div className="flex flex-col">
            <span className="text-3xl font-bold">{formatCurrency(price, 'USD')}<span className="text-lg font-normal">{period}</span></span>
            <span className="text-sm opacity-80">({formatCurrency(priceMiddleEast, 'USD')}{period} Middle East)</span>
          </div>
        );
      }
      return (
        <span>
          {formatCurrency(price, 'USD')}<span className="text-lg font-normal">{period}</span>
        </span>
      );
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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => {
            const isProfessional = plan === 'professional';
            const isEnterprise = plan === 'enterprise';
            const isStarter = plan === 'starter';
            const isCloud = plan === 'cloud';

            const features = t.raw(`${plan}.features`) as string[];

            // Determine styling based on plan type
            let cardClass = 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700';
            let textClass = 'text-slate-900 dark:text-white';
            let subtitleClass = 'text-slate-600 dark:text-slate-400';
            let checkClass = 'text-green-500';
            let buttonClass = 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100';

            if (isProfessional) {
              cardClass = 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-xl shadow-blue-500/25 scale-105';
              textClass = 'text-white';
              subtitleClass = 'text-blue-100';
              checkClass = 'text-blue-200';
              buttonClass = 'bg-white text-blue-600 hover:bg-blue-50';
            } else if (isCloud) {
              cardClass = 'bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-xl shadow-purple-500/25';
              textClass = 'text-white';
              subtitleClass = 'text-purple-100';
              checkClass = 'text-purple-200';
              buttonClass = 'bg-white text-purple-600 hover:bg-purple-50';
            }

            return (
              <motion.div key={plan} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} className={`relative rounded-2xl p-6 ${cardClass}`}>
                {/* Badges */}
                {isProfessional && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-yellow-900 text-sm font-semibold rounded-full">
                    {t(`${plan}.popular`)}
                  </div>
                )}
                {isCloud && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-semibold rounded-full flex items-center gap-1">
                    <Cloud className="w-4 h-4" />
                    {t('cloud.badge')}
                  </div>
                )}

                <h3 className={`text-xl font-semibold mb-2 ${textClass}`}>{t(`${plan}.name`)}</h3>
                <p className={`text-sm mb-4 ${subtitleClass}`}>{t(`${plan}.description`)}</p>

                <div className="mb-4">
                  <div className={textClass}>
                    {locale === 'ar' && (plan === 'starter' || plan === 'professional' || plan === 'cloud') ? (
                      renderArabicPrice(plan)
                    ) : (
                      <span className="text-3xl font-bold">
                        {renderStandardPrice(plan)}
                      </span>
                    )}
                  </div>
                  {/* Annual discount note for cloud plan */}
                  {isCloud && (
                    <p className={`text-xs mt-2 ${subtitleClass}`}>
                      {t('cloud.annualDiscount')}
                    </p>
                  )}
                </div>

                <ul className="space-y-2 mb-6">
                  {features.map((feature, i) => {
                    // Check if this is a negative feature (only for starter plan)
                    const isNegative = isStarter && isNegativeFeature(feature);
                    const featureText = formatFeatureText(feature);

                    return (
                      <li key={i} className="flex items-start gap-2">
                        {isNegative ? (
                          // Show X icon for negative features in starter plan
                          <X className="w-5 h-5 flex-shrink-0 text-red-500 dark:text-red-400" />
                        ) : (
                          // Show check icon for positive features
                          <Check className={`w-5 h-5 flex-shrink-0 ${checkClass}`} />
                        )}
                        <span className={`text-sm ${isCloud || isProfessional ? 'text-white' : 'text-slate-600 dark:text-slate-400'} ${isNegative ? 'opacity-70' : ''}`}>
                          {featureText}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <Link
                  href={plan === 'enterprise' ? `/${locale}/contact` : plan === 'cloud' ? `/${locale}/contact` : `/${locale}/contact`}
                  className={`block w-full py-3 rounded-xl font-semibold text-center transition-all ${buttonClass}`}
                >
                  {t(`${plan}.cta`)}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
