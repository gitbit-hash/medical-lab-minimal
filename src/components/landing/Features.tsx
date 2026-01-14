'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Users, TestTube, ClipboardCheck, FileText, Languages, WifiOff, CreditCard, ScrollText } from 'lucide-react';

const featureIcons = { patientManagement: Users, testManagement: TestTube, resultInput: ClipboardCheck, pdfReports: FileText, multiLanguage: Languages, offlineMode: WifiOff, billing: CreditCard, auditLogs: ScrollText };
const featureKeys = ['patientManagement', 'testManagement', 'resultInput', 'pdfReports', 'multiLanguage', 'offlineMode', 'billing', 'auditLogs'] as const;
const featureColors = ['from-blue-500 to-blue-600', 'from-purple-500 to-purple-600', 'from-green-500 to-green-600', 'from-orange-500 to-orange-600', 'from-pink-500 to-pink-600', 'from-cyan-500 to-cyan-600', 'from-yellow-500 to-yellow-600', 'from-indigo-500 to-indigo-600'];

export default function Features() {
  const t = useTranslations('Landing.features');

  return (
    <section id="features" className="py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">{t('title')}</motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="text-lg text-slate-600 dark:text-slate-400">{t('subtitle')}</motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featureKeys.map((key, index) => {
            const Icon = featureIcons[key];
            return (
              <motion.div key={key} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }} className="group relative p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-xl hover:shadow-blue-500/10">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${featureColors[index]} text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t(`${key}.title`)}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{t(`${key}.description`)}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
