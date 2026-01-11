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

export async function POST(request: Request): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const body = await request.json();
    const {
      name,
      code,
      category_id,
      description,
      specimen,
      container,
      volume,
      storage,
      methodology,
      turnaround_time,
      fees,
      is_active = true,
      parameters = [],
    } = body;

    // Validate required fields
    if (!name || !code || !category_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name, code, and category are required fields'
        },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingTemplate = await localPrisma.testTemplate.findUnique({
      where: { code },
    });

    if (existingTemplate) {
      return NextResponse.json(
        {
          success: false,
          error: 'A template with this code already exists'
        },
        { status: 400 }
      );
    }

    // Validate category exists
    const category = await localPrisma.testCategory.findUnique({
      where: { id: category_id },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found'
        },
        { status: 400 }
      );
    }

    // Validate parameters
    if (parameters && parameters.length > 0) {
      for (const param of parameters) {
        if (!param.name || !param.code) {
          return NextResponse.json(
            {
              success: false,
              error: 'All parameters must have a name and code'
            },
            { status: 400 }
          );
        }
      }
    }

    // Create template with parameters in a transaction
    const result = await localPrisma.$transaction(async (tx) => {
      // Create the template
      const template = await tx.testTemplate.create({
        data: {
          name,
          code,
          category_id,
          description,
          specimen,
          container,
          volume,
          storage,
          methodology,
          turnaround_time,
          fees,
          is_active,
        },
      });

      // Create parameters if provided
      if (parameters.length > 0) {
        await tx.testParameter.createMany({
          data: parameters.map((param: any, index: number) => ({
            test_template_id: template.id,
            name: param.name,
            code: param.code,
            units: param.units || null,
            normal_range_min: param.normal_range_min || null,
            normal_range_max: param.normal_range_max || null,
            normal_range_text: param.normal_range_text || null,
            default_value: param.default_value || null,
            is_critical: param.is_critical || false,
            sort_order: param.sort_order || index,
          })),
        });
      }

      // Return the complete template with relations
      return await tx.testTemplate.findUnique({
        where: { id: template.id },
        include: {
          category: true,
          parameters: {
            orderBy: { sort_order: 'asc' },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Test template created successfully'
    });
  } catch (error) {
    console.error('Failed to create test template:', error);

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          {
            success: false,
            error: 'A template with this code already exists'
          },
          { status: 400 }
        );
      }

      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid category ID'
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create test template'
      },
      { status: 500 }
    );
  }
}