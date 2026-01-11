// app/[locale]/login/page.tsx
import LoginClient from './login-client';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { redirect } from 'next/navigation';

const locales = ['en', 'ar', 'fr', 'es'] as const;

interface LoginPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const callbackUrl = resolvedSearchParams?.callbackUrl || `/${locale}`;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Check if user is already logged in
  const session = await getServerSession(authOptions);
  if (session) {
    redirect(callbackUrl);
  }

  // Fetch translations
  const t = await getTranslations({ locale, namespace: 'LoginPage' });

  return <LoginClient locale={locale} callbackUrl={callbackUrl} />;
}