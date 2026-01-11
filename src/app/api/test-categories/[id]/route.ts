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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, parent_id, is_active = true } = body;

    // Check if category exists
    const existingCategory = await localPrisma.testCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Test category not found'
        },
        { status: 404 }
      );
    }

    // Check if name is taken by another category
    if (name !== existingCategory.name) {
      const nameExists = await localPrisma.testCategory.findFirst({
        where: {
          name,
          id: { not: id }
        },
      });

      if (nameExists) {
        return NextResponse.json(
          {
            success: false,
            error: 'A category with this name already exists'
          },
          { status: 400 }
        );
      }
    }

    // Prevent circular reference
    if (parent_id === id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category cannot be its own parent'
        },
        { status: 400 }
      );
    }

    // Update category
    const updatedCategory = await localPrisma.testCategory.update({
      where: { id },
      data: {
        name,
        description,
        parent_id: parent_id || null,
        is_active,
        updated_at: new Date(),
      },
      include: {
        parent: true,
        children: true,
        tests: {
          where: { is_active: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedCategory,
    });
  } catch (error) {
    console.error('Failed to update test category:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update test category'
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

    // Check if category exists
    const category = await localPrisma.testCategory.findUnique({
      where: { id },
      include: {
        children: true,
        tests: true,
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

    // Check if category has children
    if (category.children.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete category with subcategories. Please delete or move subcategories first.'
        },
        { status: 400 }
      );
    }

    // Check if category has active tests
    if (category.tests.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete category with active tests. Please delete or move tests first.'
        },
        { status: 400 }
      );
    }

    // Delete the category
    await localPrisma.testCategory.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete test category:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete test category'
      },
      { status: 500 }
    );
  }
}