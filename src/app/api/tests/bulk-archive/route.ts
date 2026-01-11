// app/api/tests/bulk-archive/route.ts
import { NextResponse } from 'next/server';
import { localPrisma } from '@/app/lib/db/local-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { testIds, printed_by } = body;

    if (!Array.isArray(testIds) || testIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No test IDs provided' },
        { status: 400 }
      );
    }

    // Archive all completed tests
    const result = await localPrisma.test.updateMany({
      where: {
        id: { in: testIds },
        status: 'Completed',
        is_deleted: false
      },
      data: {
        is_printed: true,
        printed_at: new Date(),
        printed_by: printed_by || session.user?.id,
        print_count: { increment: 1 },
        sync_status: 'Pending',
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        count: result.count,
        message: `${result.count} tests archived successfully`
      }
    });
  } catch (error) {
    console.error('Failed to bulk archive tests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to archive tests' },
      { status: 500 }
    );
  }
}