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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { id } = await params;
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
      is_active,
      parameters = [],
      expired_at,
    } = body;

    // Check if template exists
    const existingTemplate = await localPrisma.testTemplate.findUnique({
      where: { id },
      include: { parameters: true },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Test template not found'
        },
        { status: 404 }
      );
    }

    // Check if code is taken by another template
    if (code !== existingTemplate.code) {
      const codeExists = await localPrisma.testTemplate.findUnique({
        where: { code },
      });

      if (codeExists) {
        return NextResponse.json(
          {
            success: false,
            error: 'A template with this code already exists'
          },
          { status: 400 }
        );
      }
    }

    // Update template using transaction to handle parameters
    const result = await localPrisma.$transaction(async (tx) => {
      // Update template
      const updatedTemplate = await tx.testTemplate.update({
        where: { id },
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
          expired_at: expired_at ? new Date(expired_at) : null,
          updated_at: new Date(),
        },
      });

      // Delete existing parameters
      await tx.testParameter.deleteMany({
        where: { test_template_id: id },
      });

      // Create new parameters
      if (parameters.length > 0) {
        await tx.testParameter.createMany({
          data: parameters.map((param: any, index: number) => ({
            test_template_id: id,
            name: param.name,
            code: param.code,
            units: param.units,
            normal_range_min: param.normal_range_min,
            normal_range_max: param.normal_range_max,
            normal_range_text: param.normal_range_text,
            default_value: param.default_value,
            is_critical: param.is_critical || false,
            sort_order: param.sort_order || index,
          })),
        });
      }

      // Return the complete updated template
      return await tx.testTemplate.findUnique({
        where: { id },
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
    });
  } catch (error) {
    console.error('Failed to update test template:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update test template'
      },
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

    // Check if template exists
    const existingTemplate = await localPrisma.testTemplate.findUnique({
      where: { id },
      include: {
        patient_tests: {
          where: { is_deleted: false }
        }
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Test template not found'
        },
        { status: 404 }
      );
    }

    // Check if template is used in any tests
    if (existingTemplate.patient_tests.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete template that is used in patient tests. Please delete the associated tests first.'
        },
        { status: 400 }
      );
    }

    // Soft delete the template by setting is_active to false
    const deletedTemplate = await localPrisma.testTemplate.update({
      where: { id },
      data: {
        is_active: false,
        expired_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: deletedTemplate,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete test template:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete test template'
      },
      { status: 500 }
    );
  }
}