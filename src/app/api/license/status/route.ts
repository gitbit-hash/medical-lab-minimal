// app/api/license/status/route.ts
import { NextResponse } from 'next/server';
import { licenseValidator } from '../../../lib/license/license-validator';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth-options';

export const dynamic = 'force-dynamic';

/**
 * License status endpoint
 * GET /api/license/status
 * 
 * Returns the current license validation status
 * Requires authentication (admin only for security)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Require authentication for license status (security)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get license validation result
    const validationResult = await licenseValidator.validateLicense();
    const licenseInfo = await licenseValidator.getLicenseInfo();

    return NextResponse.json({
      status: validationResult.status,
      isValid: validationResult.isValid,
      message: validationResult.message,
      expiresAt: validationResult.expiresAt?.toISOString(),
      gracePeriodEndsAt: validationResult.gracePeriodEndsAt?.toISOString(),
      daysRemaining: validationResult.daysRemaining,
      daysInGracePeriod: validationResult.daysInGracePeriod,
      licenseInfo: licenseInfo ? {
        status: licenseInfo.status,
        expiresAt: licenseInfo.expiresAt?.toISOString(),
        lastValidatedAt: licenseInfo.lastValidatedAt?.toISOString(),
        maxUsers: licenseInfo.maxUsers,
        maxDevices: licenseInfo.maxDevices,
      } : null,
    });
  } catch (error) {
    console.error('Failed to get license status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get license status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}



