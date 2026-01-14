'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { useLocale } from "next-intl";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  ClipboardList,
  Database,
  UserPlus,
  History,
  TestTube,
  Edit3,
  Building2,
  FileOutput,
  CreditCard,
  Microscope,
  ArrowLeft,
  X
} from 'lucide-react';

// Feature section configuration with image paths
const featureSections = [
  {
    id: 'adminDashboard',
    icon: LayoutDashboard,
    color: 'from-blue-500 to-blue-600',
    images: [
      '/images/admin-page-1.png',
      '/images/admin-page-2.png',
      '/images/admin-page-3.png',
      '/images/admin-page-4.png',
      '/images/admin-page-5.png',
    ],
  },
  {
    id: 'userManagement',
    icon: Users,
    color: 'from-purple-500 to-purple-600',
    images: [
      '/images/admin-users-1.png',
      '/images/admin-users-2.png',
    ],
  },
  {
    id: 'pdfSettings',
    icon: FileText,
    color: 'from-orange-500 to-orange-600',
    images: [
      '/images/admin-PDFSettings-1.png',
      '/images/admin-PDFSettings-2.png',
      '/images/admin-PDFSettings-3.png',
      '/images/admin-PDFSettings-4.png',
      '/images/admin-PDFSettings-5.png',
    ],
  },
  {
    id: 'receiptSettings',
    icon: Receipt,
    color: 'from-green-500 to-green-600',
    images: [
      '/images/admin-ReceiptSettings-1.png',
      '/images/admin-ReceiptSettings-2.png',
      '/images/admin-ReceiptSettings-3.png',
      '/images/admin-ReceiptSettings-4.png',
    ],
  },
  {
    id: 'auditLogs',
    icon: ClipboardList,
    color: 'from-indigo-500 to-indigo-600',
    images: [
      '/images/admin-audit-1.png',
      '/images/admin-audit-2.png',
    ],
  },
  {
    id: 'databaseBackup',
    icon: Database,
    color: 'from-red-500 to-red-600',
    images: [
      '/images/admin-database-restore.png',
    ],
  },
  {
    id: 'patientManagement',
    icon: UserPlus,
    color: 'from-teal-500 to-teal-600',
    images: [
      '/images/patients.png',
      '/images/new-patient-1.png',
      '/images/new-patient-2.png',
      '/images/new-patient-3.png',
      '/images/new-patient-4.png',
      '/images/new-patient-5.png',
    ],
  },
  {
    id: 'patientHistory',
    icon: History,
    color: 'from-cyan-500 to-cyan-600',
    images: [
      '/images/patient-history-1.png',
      '/images/patient-history-2.png',
    ],
  },
  {
    id: 'testTemplates',
    icon: TestTube,
    color: 'from-pink-500 to-pink-600',
    images: [
      '/images/test-templates-1.png',
      '/images/test-templates-2.png',
      '/images/test-categories_1.png',
    ],
  },
  {
    id: 'resultsEntry',
    icon: Edit3,
    color: 'from-amber-500 to-amber-600',
    images: [
      '/images/results-form.png',
      '/images/results-form_2.png',
    ],
  },
  {
    id: 'labToLab',
    icon: Building2,
    color: 'from-violet-500 to-violet-600',
    images: [
      '/images/lab-to-lab-1.png',
      '/images/lab-to-lab-2.png',
    ],
  },
  {
    id: 'pdfReports',
    icon: FileOutput,
    color: 'from-emerald-500 to-emerald-600',
    images: [
      '/images/PDF-CBC.png',
    ],
  },
  {
    id: 'receipts',
    icon: CreditCard,
    color: 'from-lime-500 to-lime-600',
    images: [
      '/images/receipt.png',
    ],
  },
  {
    id: 'casaAnalysis',
    icon: Microscope,
    color: 'from-rose-500 to-rose-600',
    images: [
      '/images/CASA_1.png',
      '/images/CASA_2.png',
      '/images/CASA_3.png',
      '/images/CASA_4.png',
      '/images/CASA_5.png',
      '/images/CASA_6.png',
      '/images/CASA_7.png',
      '/images/CASA_8.png',
    ],
  },
];

interface ImageCarouselProps {
  images: string[];
  sectionId: string;
}

function ImageCarousel({ images, sectionId }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const t = useTranslations('FeaturesShowcase.sections');
  const locale = useLocale() as Locale;

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      <div className="relative">
        {/* Main Image */}
        <div
          className="relative aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden cursor-pointer group"
          onClick={() => setLightboxOpen(true)}
        >
          <Image
            src={images[currentIndex]}
            alt={t(`${sectionId}.images.${currentIndex + 1}` as any) || `Screenshot ${currentIndex + 1}`}
            fill
            className="object-contain transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm bg-black/50 px-3 py-1 rounded-full">
              Click to enlarge
            </span>
          </div>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 dark:bg-slate-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 dark:bg-slate-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex
                  ? 'bg-blue-500 w-6'
                  : 'bg-white/60 hover:bg-white/80'
                  }`}
              />
            ))}
          </div>
        )}

        {/* Caption */}
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 text-center">
          {t(`${sectionId}.images.${currentIndex + 1}` as any) || `Screenshot ${currentIndex + 1} of ${images.length}`}
        </p>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="relative max-w-7xl max-h-[90vh] w-full h-full" onClick={(e) => e.stopPropagation()}>
              <Image
                src={images[currentIndex]}
                alt={t(`${sectionId}.images.${currentIndex + 1}` as any) || `Screenshot ${currentIndex + 1}`}
                fill
                className="object-contain"
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-8 h-8 text-white" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-8 h-8 text-white" />
                  </button>
                </>
              )}

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
                {currentIndex + 1} / {images.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface FeatureSectionProps {
  section: typeof featureSections[0];
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}

function FeatureSection({ section, isOpen, onToggle, index }: FeatureSectionProps) {
  const t = useTranslations('FeaturesShowcase.sections');
  const Icon = section.icon;
  const locale = useLocale() as Locale;
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-800/50 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        dir={direction}
      >
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-grow min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t(`${section.id}.title` as any)}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
            {t(`${section.id}.description` as any)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full" dir='ltr'>
            {section.images.length} {section.images.length === 1 ? 'image' : 'images'}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </div>
      </button>

      {/* Section Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-700">
              <ImageCarousel images={section.images} sectionId={section.id} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FeaturesShowcase() {
  const t = useTranslations('FeaturesShowcase');
  const locale = useLocale() as Locale;
  const direction = locale === 'ar' ? 'rtl' : 'ltr';


  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['adminDashboard']));

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setOpenSections(new Set(featureSections.map(s => s.id)));
  };

  const collapseAll = () => {
    setOpenSections(new Set());
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900" dir={direction}>
      {/* Hero Section */}
      <section className="pt-24 pb-12 md:pt-32 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('navigation.backToHome')}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              {t('hero.title')}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              {t('hero.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Controls */}
      <section className="pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {featureSections.map((section, index) => (
              <FeatureSection
                key={section.id}
                section={section}
                isOpen={openSections.has(section.id)}
                onToggle={() => toggleSection(section.id)}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4" dir='ltr'>
              Ready to Experience These Features?
            </h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto" dir='ltr'>
              Try our free demo and see how LabManagerPro can transform your laboratory operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/${locale}/demo`}
                className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
              >
                Try Free Demo
              </Link>
              <Link
                href="/#pricing"
                className="px-8 py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-400 transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
