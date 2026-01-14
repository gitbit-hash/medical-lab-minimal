
import { Locale } from '@/i18n/config';
import { useLocale, useTranslations } from 'next-intl';

export default function AboutPage() {
  const t = useTranslations('About');
  const locale = useLocale() as Locale;
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <div
      className="bg-white dark:bg-slate-900 min-h-screen"
      dir={direction}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center">
          <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">{t('subtitle')}</h2>
          <p className="mt-1 text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
            {t('title')}
          </p>
          <p className="max-w-xl mx-auto mt-5 text-xl text-gray-500 dark:text-gray-400">
            {t('description')}
          </p>
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8">
            <div className="space-y-5 sm:space-y-4">
              <h3 className="text-2xl font-bold leading-6 text-gray-900 dark:text-white sm:text-3xl sm:leading-9">
                {t('mission.title')}
              </h3>
              <p className="text-lg text-gray-500 dark:text-gray-400">
                {t('mission.description')}
              </p>
            </div>
            <div className="space-y-5 sm:space-y-4">
              <h3 className="text-2xl font-bold leading-6 text-gray-900 dark:text-white sm:text-3xl sm:leading-9">
                {t('vision.title')}
              </h3>
              <p className="text-lg text-gray-500 dark:text-gray-400">
                {t('vision.description')}
              </p>
            </div>
            <div className="space-y-5 sm:space-y-4">
              <h3 className="text-2xl font-bold leading-6 text-gray-900 dark:text-white sm:text-3xl sm:leading-9">
                {t('values.title')}
              </h3>
              <p className="text-lg text-gray-500 dark:text-gray-400">
                {t('values.description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
