import { NextResponse } from 'next/server';
import { localPrisma } from '../../lib/db/local-client';
import { globalCache } from '../../lib/utils/cashe';

const SEARCH_CACHE_TTL = 2 * 60 * 1000; // 2 minutes for search results

function generateCacheKey(search: string, categoryId: string | null, limit: number): string {
  return `test-templates:${search}:${categoryId}:${limit}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Validate search query
    if (search && search.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Search query too long (max 100 characters)'
        },
        { status: 400 }
      );
    }

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid limit parameter (1-100 allowed)'
        },
        { status: 400 }
      );
    }

    // Check cache for search results (only cache actual searches, not empty ones)
    if (search.trim()) {
      const cacheKey = generateCacheKey(search, categoryId, limit);
      const cachedResults = globalCache.get(cacheKey);

      if (cachedResults) {
        const resultsArray = Array.isArray(cachedResults) ? cachedResults : [];
        return NextResponse.json({
          success: true,
          data: resultsArray,
          cached: true,
          count: resultsArray.length,
          timestamp: new Date().toISOString()
        });
      }
    }

    let where: any = { is_active: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (categoryId) {
      where.category_id = categoryId;
    }

    const templates = await localPrisma.testTemplate.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        parameters: {
          where: {
            // Optionally filter parameters if needed
          },
          orderBy: { sort_order: 'asc' }
        }
      },
      take: limit,
      orderBy: { name: 'asc' }
    });

    // Validate and sanitize response data
    const validTemplates = templates.map(template => ({
      ...template,
      fees: typeof template.fees === 'number' ? template.fees : 0,
      parameters: Array.isArray(template.parameters) ? template.parameters : []
    }));

    // Cache search results (only if we actually searched)
    if (search.trim()) {
      const cacheKey = generateCacheKey(search, categoryId, limit);
      globalCache.set(cacheKey, validTemplates, SEARCH_CACHE_TTL);
    }

    return NextResponse.json({
      success: true,
      data: validTemplates,
      count: validTemplates.length,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to search test templates:', error);

    const errorMessage = error instanceof Error ? error.message : 'Database error';

    return NextResponse.json(
      {
        success: false,
        error: `Search failed: ${errorMessage}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}