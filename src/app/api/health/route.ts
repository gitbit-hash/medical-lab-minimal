// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { localPrisma } from '../../lib/db/local-client';
import { remoteDB } from '../../lib/db/remote-client';
import { licenseValidator } from '../../lib/license/license-validator';

export const dynamic = 'force-dynamic';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  localDb: {
    status: 'healthy' | 'unhealthy';
    responseTime?: number;
    error?: string;
  };
  remoteDb: {
    status: 'healthy' | 'unhealthy';
    responseTime?: number;
    error?: string;
  };
  license: {
    status: string;
    isValid: boolean;
    message?: string;
    daysRemaining?: number;
  };
  sync: {
    pendingPatients: number;
    pendingDoctors: number;
    pendingTests: number;
  };
}

/**
 * Health check endpoint
 * GET /api/health
 * 
 * Returns the health status of the application including:
 * - Local database connectivity
 * - Remote database connectivity
 * - Sync queue status
 */
export async function GET(): Promise<NextResponse<HealthCheckResult>> {
  const startTime = Date.now();
  const healthCheck: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    localDb: { status: 'unhealthy' },
    remoteDb: { status: 'unhealthy' },
    license: {
      status: 'unknown',
      isValid: true,
    },
    sync: {
      pendingPatients: 0,
      pendingDoctors: 0,
      pendingTests: 0,
    },
  };

  // Check local database
  try {
    const localDbStart = Date.now();
    await localPrisma.$queryRaw`SELECT 1`;
    healthCheck.localDb = {
      status: 'healthy',
      responseTime: Date.now() - localDbStart,
    };
  } catch (error) {
    healthCheck.localDb = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    healthCheck.status = 'degraded';
  }

  // Check remote database
  try {
    const remoteDbStart = Date.now();
    const isOnline = await remoteDB.isOnline();
    if (isOnline) {
      healthCheck.remoteDb = {
        status: 'healthy',
        responseTime: Date.now() - remoteDbStart,
      };
    } else {
      healthCheck.remoteDb = {
        status: 'unhealthy',
        error: 'Remote database is not accessible',
      };
      healthCheck.status = 'degraded';
    }
  } catch (error) {
    healthCheck.remoteDb = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    // Remote DB failure doesn't make the app unhealthy, just degraded
    if (healthCheck.status === 'healthy') {
      healthCheck.status = 'degraded';
    }
  }

  // Check license status
  try {
    const licenseResult = await licenseValidator.validateLicense();
    healthCheck.license = {
      status: licenseResult.status,
      isValid: licenseResult.isValid,
      message: licenseResult.message,
      daysRemaining: licenseResult.daysRemaining,
    };

    // License validation failure doesn't make app unhealthy, but marks as degraded
    if (!licenseResult.isValid && licenseResult.status !== 'grace_period') {
      if (healthCheck.status === 'healthy') {
        healthCheck.status = 'degraded';
      }
    }
  } catch (error) {
    // License check failure doesn't affect overall health
    console.warn('Failed to check license status:', error);
    healthCheck.license = {
      status: 'error',
      isValid: false,
      message: 'Failed to validate license',
    };
  }

  // Get sync queue status (only if local DB is healthy)
  if (healthCheck.localDb.status === 'healthy') {
    try {
      const [pendingPatients, pendingDoctors, pendingTests] = await Promise.all([
        localPrisma.patient.count({
          where: { sync_status: 'Pending', is_deleted: false },
        }),
        localPrisma.doctor.count({
          where: { sync_status: 'Pending', is_deleted: false },
        }),
        localPrisma.test.count({
          where: { sync_status: 'Pending', is_deleted: false },
        }),
      ]);

      healthCheck.sync = {
        pendingPatients,
        pendingDoctors,
        pendingTests,
      };
    } catch (error) {
      // Sync status check failure doesn't affect overall health
      console.warn('Failed to get sync status:', error);
    }
  }

  // Determine overall status
  if (healthCheck.localDb.status === 'unhealthy') {
    healthCheck.status = 'unhealthy';
  }

  // Set appropriate HTTP status code
  const statusCode = healthCheck.status === 'healthy' ? 200 : 
                     healthCheck.status === 'degraded' ? 200 : 
                     503; // Service Unavailable

  return NextResponse.json(healthCheck, { status: statusCode });
}

