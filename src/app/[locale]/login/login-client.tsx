// app/[locale]/login/login-client.tsx - Updated
'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

interface LoginClientProps {
  locale: string;
  callbackUrl: string;
}

type LoginErrorType =
  | 'invalidCredentials'
  | 'accountLocked'
  | 'inactiveAccount'
  | 'networkError'
  | 'serverError'
  | 'unknownError'
  | 'requiredFields'
  | 'tooManyAttempts'
  | 'accountInactive' // Add this new error type
  | null;

interface ValidationErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginClient({ locale, callbackUrl }: LoginClientProps) {
  const router = useRouter();
  const t = useTranslations('LoginPage');
  const currentLocale = useLocale();
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [error, setError] = useState<LoginErrorType>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);

  // Check for existing locale in localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem('preferred-language');
    if (savedLocale && savedLocale !== locale) {
      router.push(`/${savedLocale}/login`);
    }
  }, [locale, router]);

  // Validate form fields
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      errors.email = t('email.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('email.invalid');
    }

    // Password validation
    if (!formData.password) {
      errors.password = t('password.required');
    } else if (formData.password.length < 8) {
      errors.password = t('password.minLength');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle rate limiting
  const checkRateLimit = (): boolean => {
    const attempts = loginAttempts;
    if (attempts >= 5) {
      setError('tooManyAttempts');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setError(null);
    setValidationErrors({});

    // Validate form
    if (!validateForm()) {
      setError('requiredFields');
      return;
    }

    // Check rate limiting
    if (!checkRateLimit()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email.trim(),
        password: formData.password,
      });

      if (result?.error) {
        // Increment login attempts on failure
        setLoginAttempts(prev => prev + 1);

        // Map server errors to translation keys
        const errorMessage = result.error.toLowerCase();

        if (errorMessage.includes('inactive') || errorMessage.includes('account_inactive')) {
          setError('accountInactive');
        } else if (errorMessage.includes('invalid') || errorMessage.includes('credentials')) {
          setError('invalidCredentials');
        } else if (errorMessage.includes('locked') || errorMessage.includes('suspended')) {
          setError('accountLocked');
        } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
          setError('networkError');
        } else {
          setError('unknownError');
        }
        return;
      }

      // Reset login attempts on success
      setLoginAttempts(0);

      // Save preferred locale if remember me is checked
      if (formData.rememberMe) {
        localStorage.setItem('preferred-language', locale);
      }

      // Success - redirect
      if (result?.url) {
        router.push(result.url);
      } else {
        router.push(callbackUrl);
      }
      router.refresh();

    } catch (error) {
      console.error('Login error:', error);
      setError('serverError');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear validation error for this field when user starts typing
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleLanguageChange = (newLocale: string) => {
    localStorage.setItem('preferred-language', newLocale);
    router.push(`/${newLocale}/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  };

  const getErrorMessage = (): string => {
    if (!error) return '';
    return t(`errors.${error}`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4" dir={direction}>
      <div className="w-full max-w-md">
        {/* Language Selector */}
        <div className="flex justify-end mb-6">
          <div className="relative inline-block">
            <select
              value={locale}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg py-2 px-4 pr-10 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t('title')}
            </h1>
            <p className="text-gray-600">
              {t('subtitle')}
            </p>
          </div>

          {/* Error Messages */}
          {(error || Object.keys(validationErrors).length > 0) && (
            <div className={`mb-6 p-4 rounded-lg ${error === 'accountInactive'
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-red-50 border border-red-200'
              }`}>
              {error && (
                <div className="flex items-start">
                  <svg className={`h-5 w-5 mt-0.5 mr-2 shrink-0 ${error === 'accountInactive' ? 'text-yellow-600' : 'text-red-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className={`font-medium text-sm ${error === 'accountInactive' ? 'text-yellow-700' : 'text-red-700'
                      }`}>
                      {getErrorMessage()}
                    </p>
                    {error === 'accountInactive' && (
                      <p className="text-sm text-yellow-600 mt-1">
                        {t('errors.contactAdmin')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {Object.keys(validationErrors).length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-red-700 mb-2">
                    {t('validation.fixErrors')}
                  </p>
                  <ul className="text-xs text-red-600 space-y-1">
                    {validationErrors.email && (
                      <li className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-2"></span>
                        {validationErrors.email}
                      </li>
                    )}
                    {validationErrors.password && (
                      <li className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-2"></span>
                        {validationErrors.password}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Login Attempts Warning */}
          {loginAttempts > 0 && loginAttempts < 5 && (
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm text-yellow-700">
                  {loginAttempts} {loginAttempts === 1 ? 'attempt' : 'attempts'} failed
                </span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('email.label')}
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                    ${validationErrors.email ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder={t('email.placeholder')}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {t('password.label')}
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                    ${validationErrors.password ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder={t('password.placeholder')}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                disabled={isLoading}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
              <label htmlFor="rememberMe" className="mx-2 block text-sm text-gray-700">
                {t('buttons.rememberMe')}
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('buttons.loggingIn')}
                </div>
              ) : (
                t('buttons.login')
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center text-xs text-gray-500">
              <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>{t('security.message')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}