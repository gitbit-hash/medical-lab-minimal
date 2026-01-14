// i18n/request.ts
import { getRequestConfig } from 'next-intl/server';

// Define locales as readonly array
const locales = ['en', 'ar', 'fr', 'es'] as const;
type Locale = typeof locales[number];
const defaultLocale: Locale = 'en';

// Type guard to check if a string is a valid locale
function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Validate the incoming locale
  let safeLocale: Locale = defaultLocale;

  if (locale && isValidLocale(locale)) {
    safeLocale = locale;
  }

  try {
    const messages = (await import(`../../messages/${safeLocale}.json`)).default;

    // Validate that we have the expected structure
    if (!messages.Navigation) {
      console.warn(`⚠️ No Navigation namespace found in ${safeLocale}.json`);
    }

    if (!messages.HomePage) {
      console.warn(`⚠️ No HomePage namespace found in ${safeLocale}.json`);
    }

    return {
      locale: safeLocale,
      messages
    };
  } catch (error) {
    console.error(`❌ Failed to load messages for ${safeLocale}:`, error);

    // Fallback to default locale
    try {
      // Fixed the path here
      const fallbackMessages = (await import(`../../messages/${defaultLocale}.json`)).default;

      return {
        locale: defaultLocale,
        messages: fallbackMessages
      };
    } catch (fallbackError) {
      console.error('💥 Critical: Could not load fallback messages:', fallbackError);

      // Return empty messages as last resort
      return {
        locale: defaultLocale,
        messages: {}
      };
    }
  }
});