// app/api/test-templates/route.ts
import { NextResponse } from 'next/server';
import { localPrisma } from '../../../lib/db/local-client';
import { ApiResponse } from '../../../types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');

    let where: any = { is_active: true };

    if (categoryId) {
      where.category_id = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const templates = await localPrisma.testTemplate.findMany({
      where,
      include: {
        category: true,
        parameters: {
          orderBy: { sort_order: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Failed to fetch test templates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch test templates'
      },
      { status: 500 }
    );
  }
}