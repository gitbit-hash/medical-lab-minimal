
import { setRequestLocale, getTranslations } from 'next-intl/server';

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Terms');
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <div
      className="bg-white dark:bg-slate-900 min-h-screen py-16 px-4 sm:px-6 lg:px-8"
      dir={direction}
    >
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl mb-8">
          {t('title')}
        </h1>
        <div className="prose text-gray-300 prose-blue prose-lg dark:prose-invert">
          <p>{t('intro')}</p>

          <h3>{t('acceptance.title')}</h3>
          <p>{t('acceptance.description')}</p>

          <h3>{t('usage.title')}</h3>
          <p>{t('usage.description')}</p>

          <h3>{t('accounts.title')}</h3>
          <p>{t('accounts.description')}</p>

          <h3>{t('intellectual.title')}</h3>
          <p>{t('intellectual.description')}</p>

          <h3>{t('termination.title')}</h3>
          <p>{t('termination.description')}</p>

          <h3>{t('liability.title')}</h3>
          <p>{t('liability.description')}</p>

          <h3>{t('changes.title')}</h3>
          <p>{t('changes.description')}</p>

          <h3>{t('contact.title')}</h3>
          <p>{t('contact.description')}</p>

        </div>
      </div>
    </div>
  );
}
