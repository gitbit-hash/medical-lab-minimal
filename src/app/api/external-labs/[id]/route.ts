// app/api/external-labs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from '@/app/lib/db/local-client';
import { getTranslatedEntityType } from '@/app/lib/audit/get-translated-entity-type';
import { Prisma } from '@prisma/client';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: labId } = await context.params;

    // Check if the lab is assigned to any tests
    const testsUsingLab = await localPrisma.test.count({
      where: {
        external_lab_id: labId,
        is_deleted: false
      }
    });

    if (testsUsingLab > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete lab. It is assigned to one or more tests. Please remove assignments first.'
        },
        { status: 400 }
      );
    }

    // Check if there are any external lab prices associated
    const pricesCount = await localPrisma.externalLabTestPrice.count({
      where: { external_lab_id: labId }
    });

    const originalLab = await localPrisma.externalLab.findUnique({
      where: { id: labId }
    });

    if (!originalLab) {
      throw new Error('External lab not found');
    }

    // Soft delete by setting is_deleted to true (if you have that field)
    // If you don't have is_deleted in ExternalLab model, you need to add it or do hard delete
    const deletedLab = await localPrisma.externalLab.update({
      where: { id: labId },
      data: {
        is_deleted: true,
        name: `DELETED_${Date.now()}_${labId}`, // Rename to avoid conflicts
      }
    });

    // Alternatively, if you want hard delete:
    // const deletedLab = await localPrisma.externalLab.delete({
    //   where: { id: labId }
    // });

    // Also delete associated prices
    if (pricesCount > 0) {
      await localPrisma.externalLabTestPrice.deleteMany({
        where: { external_lab_id: labId }
      });
    }

    // Create audit log
    await localPrisma.auditLog.create({
      data: {
        user_id: session.user.id,
        action: 'DELETE_EXTERNAL_LAB',
        entity_type: getTranslatedEntityType('ExternalLab'),
        entity_id: labId,
        description: 'audit.delete_external_lab',
        translation_params: {
          lab_name: originalLab.name
        },
        old_values: originalLab,
        new_values: Prisma.JsonNull
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Lab deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete external lab:', error);
    return NextResponse.json(
      { error: 'Failed to delete external lab' },
      { status: 500 }
    );
  }
}