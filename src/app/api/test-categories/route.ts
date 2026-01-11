import { NextResponse } from 'next/server';
import { localPrisma } from '../../lib/db/local-client';
import { globalCache } from '../../lib/utils/cashe';
import { ApiResponse } from '@/app/types';

// Cache categories for 10 minutes
const CATEGORIES_CACHE_TTL = 10 * 60 * 1000;
const CACHE_KEY = 'test-categories';

export async function GET() {
  try {
    // Check cache first
    const cachedCategories = globalCache.get(CACHE_KEY);
    if (cachedCategories) {
      return NextResponse.json({
        success: true,
        data: cachedCategories,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    const categories = await localPrisma.testCategory.findMany({
      where: {
        is_active: true
      },
      include: {
        children: {
          where: { is_active: true },
          include: {
            tests: {
              where: { is_active: true },
              select: {
                id: true,
                name: true,
                code: true,
                fees: true,
                specimen: true,
                turnaround_time: true,
                description: true
              }
            }
          }
        },
        tests: {
          where: { is_active: true },
          select: {
            id: true,
            name: true,
            code: true,
            fees: true,
            specimen: true,
            turnaround_time: true,
            description: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Transform data for better caching (remove unnecessary fields)
    const transformedCategories = categories.map(category => ({
      ...category,
      tests: category.tests?.map(test => ({
        id: test.id,
        name: test.name,
        code: test.code,
        fees: test.fees || 0,
        specimen: test.specimen,
        turnaround_time: test.turnaround_time,
        description: test.description
      })) || []
    }));

    // Store in cache
    globalCache.set(CACHE_KEY, transformedCategories, CATEGORIES_CACHE_TTL);

    return NextResponse.json({
      success: true,
      data: transformedCategories,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to fetch test categories:', error);

    // Even on error, try to return cached data if available
    const cachedCategories = globalCache.get(CACHE_KEY);
    if (cachedCategories) {
      return NextResponse.json({
        success: true,
        data: cachedCategories,
        cached: true,
        error: 'Using cached data due to server error',
        timestamp: new Date().toISOString()
      });
    }

    const errorMessage = error instanceof Error ? error.message : 'Database error';

    return NextResponse.json(
      {
        success: false,
        error: `Failed to load test categories: ${errorMessage}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const body = await request.json();
    const { name, description, parent_id, is_active = true } = body;

    // Check if category name already exists
    const existingCategory = await localPrisma.testCategory.findUnique({
      where: { name },
    });

    if (existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: 'A category with this name already exists'
        },
        { status: 400 }
      );
    }

    // Validate parent exists if provided
    if (parent_id) {
      const parentCategory = await localPrisma.testCategory.findUnique({
        where: { id: parent_id },
      });

      if (!parentCategory) {
        return NextResponse.json(
          {
            success: false,
            error: 'Parent category not found'
          },
          { status: 400 }
        );
      }
    }

    // Create category
    const category = await localPrisma.testCategory.create({
      data: {
        name,
        description,
        parent_id: parent_id || null,
        is_active,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Failed to create test category:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create test category'
      },
      { status: 500 }
    );
  }
}