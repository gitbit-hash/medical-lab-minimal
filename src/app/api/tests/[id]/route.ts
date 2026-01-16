import { NextRequest, NextResponse } from 'next/server';
import { localPrisma } from '../../../lib/db/local-client';
import { ApiResponse } from '../../../types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeTemplate = searchParams.get('includeTemplate') === 'true';
    const test = await localPrisma.test.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        test_template: {
          include: {
            category: true,
            parameters: {
              orderBy: { sort_order: 'asc' },
            },
          },
        },
      },
    });

    if (!test || test.is_deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Test not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: test,
    });
  } catch (error) {
    console.error('Failed to fetch test:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch test'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingTest = await localPrisma.test.findUnique({
      where: { id },
    });

    if (!existingTest) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    const updateData: any = {
      ...body,
      updated_at: new Date(),
    };

    // Update the test
    const updatedTest = await localPrisma.test.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        doctor: true,
        test_template: {
          include: {
            category: true,
            parameters: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedTest
    });

  } catch (error) {
    console.error('Failed to update test:', error);
    return NextResponse.json(
      { error: 'Failed to update test' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { id } = await params;

    // Check if test exists
    const existingTest = await localPrisma.test.findUnique({
      where: { id },
    });

    if (!existingTest) {
      return NextResponse.json(
        {
          success: false,
          error: 'Test not found'
        },
        { status: 404 }
      );
    }

    if (existingTest.is_deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Test already deleted'
        },
        { status: 400 }
      );
    }

    // Soft delete the test
    const test = await localPrisma.test.update({
      where: { id },
      data: {
        is_deleted: true,
        sync_status: 'Pending',
      },
    });

    return NextResponse.json({
      success: true,
      data: test,
    });
  } catch (error) {
    console.error('Failed to delete test:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete test'
      },
      { status: 500 }
    );
  }
}