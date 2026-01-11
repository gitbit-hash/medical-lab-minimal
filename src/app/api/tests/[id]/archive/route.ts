// app/api/tests/[id]/archive/route.ts
import { NextResponse } from 'next/server';
import { localPrisma } from '@/app/lib/db/local-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { is_printed, printed_by } = body;

    // Check if test exists
    const existingTest = await localPrisma.test.findUnique({
      where: { id, is_deleted: false }
    });

    if (!existingTest) {
      return NextResponse.json(
        { success: false, error: 'Test not found' },
        { status: 404 }
      );
    }

    // Only archive completed tests
    if (existingTest.status !== 'Completed') {
      return NextResponse.json(
        { success: false, error: 'Only completed tests can be archived' },
        { status: 400 }
      );
    }

    // Archive the test
    const updatedTest = await localPrisma.test.update({
      where: { id },
      data: {
        is_printed: is_printed ?? true,
        printed_at: new Date(),
        printed_by: printed_by || session.user?.id,
        print_count: { increment: 1 },
        sync_status: 'Pending',
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedTest
    });
  } catch (error) {
    console.error('Failed to archive test:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to archive test' },
      { status: 500 }
    );
  }
}