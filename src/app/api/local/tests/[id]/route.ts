// app/api/local/tests/[id]/route.ts
import { NextResponse } from 'next/server';
import { localPrisma } from '@/app/lib/db/local-client';
import { ApiResponse } from '@/app/types';

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Fetch a single locally stored test by ID
 * Works for both local (unsynced) and synced tests in the local database.
 */
export async function GET(
  request: Request,
  { params }: RouteParams): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeTemplate = searchParams.get('includeTemplate') === 'true';

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing test ID' },
        { status: 400 }
      );
    }

    // 🔍 Fetch test with relations from local SQLite
    const test = await localPrisma.test.findUnique({
      where: { id },
      include: includeTemplate
        ? {
          patient: true,
          doctor: true,
          test_template: {
            include: { category: true, parameters: true },
          },
        }
        : { patient: true, doctor: true },
    });

    if (!test) {
      return NextResponse.json(
        { success: false, error: 'Test not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: test });
  } catch (error) {
    console.error('❌ Failed to fetch local test:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch local test' },
      { status: 500 }
    );
  }
}

/**
 * Update a local test (used when saving results offline)
 */
export async function PUT(request: Request,
  { params }: RouteParams): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { id } = await params;

    const body = await request.json();

    const updated = await localPrisma.test.update({
      where: { id },
      data: {
        results: body.results,
        status: body.status,
        tested_at: body.tested_at ? new Date(body.tested_at) : null,
        completed_at: body.completed_at ? new Date(body.completed_at) : null,
        sync_status: 'Pending', // mark for sync
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('Failed to update local test:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Update failed' },
      { status: 500 }
    );
  }
}