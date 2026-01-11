// app/[locale]/api/tests/expiration-stats/route.ts
import { NextResponse } from 'next/server';
import { localPrisma } from '../../../lib/db/local-client'

export async function GET() {
  try {
    const now = new Date();
    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(now.getDate() + 15);

    // Count test templates that will expire within 15 days
    const expiringSoonCount = await localPrisma.testTemplate.count({
      where: {
        expired_at: {
          lte: fifteenDaysFromNow,
          gte: now,
        },
        is_active: true, // Only count active templates
      },
    });

    // Debug: Get the actual templates to verify
    const expiringTemplates = await localPrisma.testTemplate.findMany({
      where: {
        expired_at: {
          lte: fifteenDaysFromNow,
          gte: now,
        },
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
        expired_at: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        expiringSoon: expiringSoonCount,
        debug: {
          templates: expiringTemplates,
          dateRange: {
            from: now,
            to: fifteenDaysFromNow,
          },
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch expiration stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch expiration statistics'
      },
      { status: 500 }
    );
  }
}