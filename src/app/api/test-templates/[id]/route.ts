// app/api/test-templates/[id]/route.ts
import { NextResponse } from 'next/server';
import { localPrisma } from '../../../lib/db/local-client';
import { ApiResponse } from '../../../types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { id } = await params;

    const testTemplate = await localPrisma.testTemplate.findUnique({
      where: { id },
      include: {
        category: true,
        parameters: {
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    if (!testTemplate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Test template not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: testTemplate,
    });
  } catch (error) {
    console.error('Failed to fetch test template:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch test template'
      },
      { status: 500 }
    );
  }
}