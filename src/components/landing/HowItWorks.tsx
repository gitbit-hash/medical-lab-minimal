'use client';

import { useTranslations, useLocale } from 'next-intl';
import type { Locale } from '@/i18n/config';
import { motion } from 'framer-motion';
import { UserPlus, ClipboardList, FlaskConical, FileOutput } from 'lucide-react';

const steps = [
  { key: 'step1', icon: UserPlus, color: 'from-blue-500 to-blue-600' },
  { key: 'step2', icon: ClipboardList, color: 'from-purple-500 to-purple-600' },
  { key: 'step3', icon: FlaskConical, color: 'from-green-500 to-green-600' },
  { key: 'step4', icon: FileOutput, color: 'from-orange-500 to-orange-600' },
];

export default function HowItWorks() {
  const t = useTranslations('Landing.howItWorks');
  const locale = useLocale() as Locale;
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <section className="py-20 md:py-32 bg-slate-50 dark:bg-slate-900/50" dir={direction}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">{t('title')}</motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="text-lg text-slate-600 dark:text-slate-400">{t('subtitle')}</motion.p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-[calc(100%-12rem)] h-1 bg-gradient-to-r from-blue-500 via-purple-500 via-green-500 to-orange-500 rounded-full" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div key={step.key} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.15 }} className="relative text-center">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-8 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-400 z-10">{index + 1}</div>
                  <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 pt-10 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} text-white mb-4 shadow-lg`}><Icon className="w-8 h-8" /></div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{t(`${step.key}.title`)}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{t(`${step.key}.description`)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
