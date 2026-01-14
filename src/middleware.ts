// middleware.ts - Fixed version with language change support
import { getToken } from "next-auth/jwt";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { extractRequestInfo } from './app/middleware/audit';
import { prisma } from '@/app/lib/prisma';
import { Prisma } from '@prisma/client';
import { getTranslatedEntityType } from '@/app/lib/audit/get-translated-entity-type';

const locales = ['en', 'ar', 'fr', 'es'];
const defaultLocale = 'en';

function getLocale(request: NextRequest) {
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }
  return defaultLocale;
}

// Helper function to create audit logs for system events
async function createSystemAuditLog(data: {
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  newValues?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}) {
  try {
    let systemUser = await prisma.user.findFirst({
      where: { email: 'system@lab.local' }
    });

    if (!systemUser) {
      systemUser = await prisma.user.create({
        data: {
          email: 'system@lab.local',
          password_hash: '',
          name: 'System',
          role: 'Admin',
          is_active: false,
          can_give_discount: false,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        user_id: systemUser.id,
        action: data.action,
        entity_type: data.entityType,
        entity_id: data.entityId || null,
        description: data.description,
        new_values: data.newValues ? data.newValues : Prisma.JsonNull,
        ip_address: data.ip || null,
        user_agent: data.userAgent || null,
        created_at: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to create system audit log:', error);
  }
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

  // If no locale in path and not a special route, continue without redirect
  if (!pathnameHasLocale && pathname !== '/' && pathname !== '/login') {
    return NextResponse.next();
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
  if (isLoginPage && token && request.method === 'GET') {
    try {
      const { ip, userAgent } = extractRequestInfo(request);
      await prisma.auditLog.create({
        data: {
          user_id: token.sub!,
          action: 'LOGIN_PAGE_ACCESS',
          entity_type: getTranslatedEntityType('User'),
          entity_id: token.sub!,
          description: 'Authenticated user accessed login page',
          ip_address: ip,
          user_agent: userAgent,
          new_values: {
            email: token.email,
            role: token.role,
            preferred_language: token.preferred_language
          },
          created_at: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to log login page access:', error);
    }
  }

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

      // Log failed access attempts using system user
      const { ip, userAgent } = extractRequestInfo(request);
      await createSystemAuditLog({
        action: 'UNAUTHENTICATED_ACCESS',
        entityType: getTranslatedEntityType('Route'),
        description: `Unauthenticated access attempt to ${pathname}`,
        newValues: {
          path: pathname,
          method: 'GET',
          locale: currentPathLocale
        },
        ip,
        userAgent,
      });

      // Set callbackUrl to the current page (excluding login pages)
      const currentUrl = new URL(request.url);
      if (!currentUrl.pathname.includes('/login')) {
        loginUrl.searchParams.set('callbackUrl', currentUrl.pathname + currentUrl.search);
      }

      return Response.redirect(loginUrl);
    }

    // Check admin permissions for super-admin routes
    if (pathname.includes("/super-admin") && token.role !== "SuperAdmin") {
      try {
        const { ip, userAgent } = extractRequestInfo(request);
        await prisma.auditLog.create({
          data: {
            user_id: token.sub!,
            action: 'UNAUTHORIZED_ADMIN_ACCESS',
            entity_type: getTranslatedEntityType('User'),
            entity_id: token.sub!,
            description: `User attempted to access admin route: ${pathname}`,
            ip_address: ip,
            user_agent: userAgent,
            new_values: {
              email: token.email,
              role: token.role,
              attempted_path: pathname,
              preferred_language: token.preferred_language
            },
            created_at: new Date(),
          },
        });
      } catch (error) {
        console.error('Failed to log unauthorized admin access:', error);
      }

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