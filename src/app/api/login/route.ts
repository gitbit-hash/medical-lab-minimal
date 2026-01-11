// app/login/route.ts - This handles redirects from old /login URLs
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'ar', 'fr', 'es'];
const defaultLocale = 'en';

export function GET(request: NextRequest) {
  // Get the locale from cookie or default
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  const locale = (cookieLocale && locales.includes(cookieLocale))
    ? cookieLocale
    : defaultLocale;

  // Redirect to locale-specific login
  const loginUrl = new URL(`/${locale}/login`, request.url);

  // Preserve callback URL if exists
  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
  if (callbackUrl) {
    loginUrl.searchParams.set('callbackUrl', callbackUrl);
  }

  return NextResponse.redirect(loginUrl);
}