
import { setRequestLocale, getTranslations } from 'next-intl/server';

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Contact');
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen" dir={direction}>
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto md:max-w-none md:grid md:grid-cols-2 md:gap-8">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl">
              {t('title')}
            </h2>
            <div className="mt-3">
              <p className="text-lg text-gray-500 dark:text-gray-400">
                {t('description')}
              </p>
            </div>
            <div className="mt-9">
              <div className="flex">
                <div className="flex-shrink-0">

                  <svg className="h-6 w-6 text-gray-400 mx-2" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M20.52 3.49C18.18 1.13 15.19 0 12 0A11.97 11.97 0 000 12c0 2.04.6 3.93 1.62 5.52L0 24l6.47-1.62C8.07 23.4 9.97 24 12 24c6.63 0 12-5.37 12-12 0-3.19-1.13-6.18-3.48-8.51zM12 21.88c-1.73 0-3.41-.46-4.88-1.32l-.35-.21-3.65.92.92-3.65-.21-.35C3.58 15.41 3.12 13.73 3.12 12c0-4.86 3.96-8.82 8.82-8.82 2.35 0 4.57.92 6.23 2.59a8.74 8.74 0 012.59 6.23c0 4.86-3.96 8.88-8.82 8.88zm4.82-6.57c-.22-.11-1.32-.65-1.52-.73-.2-.07-.34-.11-.48.11-.14.22-.55.73-.68.88-.13.15-.26.17-.48.06-.22-.11-.92-.34-1.75-1.08-.65-.58-1.08-1.29-1.21-1.51-.13-.22-.01-.34.1-.45.1-.1.22-.26.33-.39.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.39-.06-.11-.48-1.17-.66-1.59-.18-.42-.36-.36-.48-.37-.12-.01-.26-.01-.39-.01-.13 0-.34.05-.52.26-.18.21-.69.67-.69 1.64 0 .97.71 1.91.81 2.04.1.13 1.4 2.14 3.39 3 1.99.86 1.99.57 2.35.54.36-.03 1.17-.48 1.33-.94.16-.46.16-.85.11-.94-.05-.09-.18-.14-.39-.25z"
                      fill="#25D366"
                    />
                  </svg>
                </div>
                <div className="ml-3 text-base text-gray-500 dark:text-gray-400" dir="ltr">
                  <p>{t('phone')}</p>
                </div>
              </div>
              <div className="mt-6 flex">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-3 text-base text-gray-500 dark:text-gray-400">
                  <p>{t('email')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
