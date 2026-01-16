// middleware.ts - Fixed version with language change support
import { getToken } from "next-auth/jwt";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';


const locales = ['en', 'ar', 'fr', 'es'];
const defaultLocale = 'en';

function getLocale(request: NextRequest) {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }
  return defaultLocale;
}



export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const token = await getToken({ req: request });

  // Skip API routes entirely - they should not have locale prefixes
  if (pathname.startsWith('/api/')) {
    if (!pathname.startsWith('/api/auth') && !token) {
      return new Response('Unauthorized', { status: 401 });
    }
    return NextResponse.next();
  }

  // Check if the pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Extract the current locale from the pathname
  const currentPathLocale = pathnameHasLocale ? pathname.split('/')[1] : null;

  // Handle root path - redirect to locale-specific home
  if (!pathnameHasLocale && pathname === '/') {
    const locale = token?.preferred_language || getLocale(request);
    request.nextUrl.pathname = `/${locale}`;
    return Response.redirect(request.nextUrl);
  }

  // Handle /login without locale - redirect to locale-specific login
  if (pathname === '/login' || pathname === '/login/') {
    const locale = token?.preferred_language || getLocale(request);
    const loginUrl = new URL(`/${locale}/login`, request.url);

    const callbackUrl = searchParams.get('callbackUrl');
    if (callbackUrl && !callbackUrl.includes('/login')) {
      loginUrl.searchParams.set('callbackUrl', callbackUrl);
    }

    return Response.redirect(loginUrl);
  }

  // If no locale in path and not a special route, redirect to default/preferred locale
  if (!pathnameHasLocale && pathname !== '/' && pathname !== '/login') {
    const locale = token?.preferred_language || getLocale(request);
    const newUrl = new URL(`/${locale}${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`, request.url);
    return Response.redirect(newUrl);
  }

  // IMPORTANT: Check if there's a language change cookie
  const languageChangeCookie = request.cookies.get('language_change');

  // If user just changed language, respect the current URL locale and set a cookie
  if (currentPathLocale && token && languageChangeCookie?.value === 'true') {
    // Clear the language change cookie
    const response = NextResponse.next();
    response.cookies.delete('language_change');

    // Add headers for debugging
    response.headers.set('X-Language-Change', 'handled');
    response.headers.set('X-Current-Locale', currentPathLocale);

    // Continue with the current locale (don't redirect)
    return response;
  }

  // If user is authenticated and the URL locale doesn't match their preference,
  // but they haven't explicitly changed it, redirect to their preference
  if (token?.preferred_language && currentPathLocale &&
    currentPathLocale !== token.preferred_language &&
    !languageChangeCookie) {

    // Check if this is a login redirect (user just logged in)
    if (request.nextUrl.searchParams.get('fromLogin') === 'true') {
      // User just logged in - respect their preference
      const newUrl = new URL(request.url);
      newUrl.pathname = newUrl.pathname.replace(`/${currentPathLocale}`, `/${token.preferred_language}`);
      return Response.redirect(newUrl);
    }

    // For other cases, we might want to keep the current locale
    // unless it's the first time they're accessing after login
    // We'll add a flag to track if they've seen this page before
    const seenPageCookie = request.cookies.get(`seen_${currentPathLocale}_${pathname}`);

    if (!seenPageCookie) {
      // First time seeing this page in this locale - redirect to preferred
      const newUrl = new URL(request.url);
      newUrl.pathname = newUrl.pathname.replace(`/${currentPathLocale}`, `/${token.preferred_language}`);

      return Response.redirect(newUrl);
    }
  }

  // Check if this is a login page
  const isLoginPage = pathname.includes('/login');
  const isSignupPage = pathname.includes('/signup');

  // Log successful login attempts


  // Define public paths
  const publicPathnames = [
    '/login',
    '/signup',
    '/',
    '/about',
    '/contact',
    '/features',
    '/privacy',
    '/terms'
  ];

  function isPublicPath(path: string) {
    const pathWithoutLocale = locales.some(loc => path.startsWith(`/${loc}`))
      ? path.replace(new RegExp(`^/(${locales.join('|')})`), '') || '/'
      : path;

    return publicPathnames.some(publicPath =>
      pathWithoutLocale === publicPath || pathWithoutLocale.startsWith(publicPath + '/')
    );
  }

  const isPublic = isPublicPath(pathname);

  // Authentication check for protected routes
  if (!isPublic) {
    // Redirect to login if not authenticated
    if (!token) {
      const loginUrl = new URL(`/${currentPathLocale || getLocale(request)}/login`, request.url);



      // Set callbackUrl to the current page (excluding login pages)
      const currentUrl = new URL(request.url);
      if (!currentUrl.pathname.includes('/login')) {
        loginUrl.searchParams.set('callbackUrl', currentUrl.pathname + currentUrl.search);
      }

      return Response.redirect(loginUrl);
    }

    // Check admin permissions for super-admin routes
    if (pathname.includes("/super-admin") && token.role !== "SuperAdmin") {


      return new Response('Unauthorized', { status: 401 });
    }
  } else if (token && (isLoginPage || isSignupPage)) {
    // If user is already authenticated and trying to access login/signup page
    // Redirect to dashboard or callbackUrl
    const callbackUrl = searchParams.get('callbackUrl');
    if (callbackUrl && !callbackUrl.includes('/login')) {
      return Response.redirect(new URL(callbackUrl, request.url));
    }
    return Response.redirect(new URL(`/${currentPathLocale || token.preferred_language || 'en'}/dashboard`, request.url));
  }

  // Set a cookie to mark that the user has seen this page in this locale
  if (currentPathLocale && token) {
    const response = NextResponse.next();
    const seenPageKey = `seen_${currentPathLocale}_${pathname}`;
    if (!request.cookies.get(seenPageKey)) {
      response.cookies.set(seenPageKey, 'true', {
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
        httpOnly: true
      });
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files, API routes, and _next
    '/((?!api|_next|_vercel|favicon.ico|sitemap.xml|robots.txt|.*\\.).*)'
  ]
};