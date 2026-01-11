// components/LanguageSwitcher.tsx - Updated
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
];

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = useLocale();
  const { data: session, update: updateSession } = useSession();
  const [isChanging, setIsChanging] = useState(false);

  const changeLanguage = async (newLocale: string) => {
    if (isChanging || currentLocale === newLocale) return;

    setIsChanging(true);

    try {
      // Set a cookie to indicate language change is in progress
      document.cookie = `language_change=true; path=/; max-age=60`; // 1 minute

      // Update user preference in database
      const response = await fetch('/api/admin/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language: newLocale }),
      });

      if (!response.ok) {
        throw new Error('Failed to update language preference');
      }

      // Update session with new language
      if (session) {
        await updateSession({
          ...session,
          user: {
            ...session.user,
            preferred_language: newLocale,
            language: newLocale,
          }
        });
      }

      // Navigate to the same page in new language
      const segments = pathname.split('/').filter(Boolean);
      const hasLocale = languages.some(lang => lang.code === segments[0]);
      const pathWithoutLocale = hasLocale ? segments.slice(1) : segments;
      const newPathname = pathWithoutLocale.length > 0
        ? `/${newLocale}/${pathWithoutLocale.join('/')}`
        : `/${newLocale}`;

      // Force a hard refresh to ensure middleware sees the cookie
      window.location.href = newPathname;

    } catch (error) {
      console.error('Language change error:', error);
      // Clear the cookie if there's an error
      document.cookie = 'language_change=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      setIsChanging(false);
    }
  };

  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0];

  return (
    <div className="relative group text-gray-700">
      <button
        className={`flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${isChanging ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        disabled={isChanging}
      >
        <span className="hidden sm:block text-sm">
          {isChanging ? 'Changing...' : currentLanguage?.nativeName}
        </span>
        <span className={`text-xs transition-transform ${isChanging ? 'animate-spin' : ''}`}>
          {isChanging ? '⟳' : '▼'}
        </span>
      </button>

      <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            disabled={isChanging || currentLocale === language.code}
            className={`flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-blue-50 ${currentLocale === language.code
              ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
              : 'text-gray-700'
              } ${isChanging ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="text-lg">{language.flag}</span>
            <div className="flex flex-col">
              <span className="font-medium">{language.nativeName}</span>
              <span className="text-xs text-gray-500">{language.name}</span>
            </div>
            {currentLocale === language.code && (
              <span className="ml-auto text-blue-500 text-sm">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}