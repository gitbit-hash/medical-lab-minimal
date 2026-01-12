import { NextResponse } from 'next/server';
import { localPrisma } from '../../../lib/db/local-client';
import { ApiResponse } from '../../../types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { id } = await params;

    const category = await localPrisma.testCategory.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          include: {
            tests: {
              where: { is_active: true },
            },
          },
        },
        tests: {
          where: { is_active: true },
          include: {
            parameters: {
              orderBy: { sort_order: 'asc' },
            },
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Test category not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Failed to fetch test category:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch test category'
      },
      { status: 500 }
    );
  }
}