// app/middleware/audit.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Helper to extract IP and user agent
export function extractRequestInfo(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const userAgent = request.headers.get('user-agent') || 'unknown';

  return { ip, userAgent };
}

// Middleware to log API requests
export async function auditMiddleware(
  request: NextRequest,
  response: NextResponse
) {
  // Skip for non-authenticated routes
  const publicRoutes = ['/api/auth', '/login', '/_next', '/favicon.ico'];
  if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return response;
  }

  try {
    const { ip, userAgent } = extractRequestInfo(request);

    // Try to get user ID from session token or headers
    let userId = null;
    const authHeader = request.headers.get('authorization');

    if (authHeader?.startsWith('Bearer ')) {
      // For API tokens, you might want to decode the JWT here
      // This is a simplified version
    }

    // Log the request (you might want to limit this to important actions)
    if (request.method !== 'GET' && request.method !== 'OPTIONS') {
      await prisma.auditLog.create({
        data: {
          user_id: userId || 'system',
          action: `API_${request.method}`,
          entity_type: 'API',
          description: `${request.method} ${request.nextUrl.pathname}`,
          ip_address: ip,
          user_agent: userAgent,
          new_values: {
            method: request.method,
            path: request.nextUrl.pathname,
            query: Object.fromEntries(request.nextUrl.searchParams)
          },
          created_at: new Date(),
        },
      });
    }
  } catch (error) {
    console.error('Audit middleware error:', error);
    // Don't block the request if audit logging fails
  }

  return response;
}