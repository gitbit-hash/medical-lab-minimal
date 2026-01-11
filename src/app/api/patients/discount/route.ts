import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from '@/app/lib/db/local-client'; // Use localPrisma consistently
import { getTranslatedEntityType } from '@/app/lib/audit/get-translated-entity-type';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {

      patientId,
      discountAmount,
      discountPercentage,
      discountType,
      discountReason,
      originalTotal,
      finalTotal
    } = body;

    // Get user's discount permissions
    const user = await localPrisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        can_give_discount: true,
        max_discount_percentage: true,
        max_discount_amount: true,
        discount_type: true,
      }
    });

    if (!user?.can_give_discount) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to apply discounts' },
        { status: 403 }
      );
    }

    // Validate discount against user's limits
    if (discountType === 'Percentage') {
      if (user.max_discount_percentage && discountPercentage > user.max_discount_percentage) {
        return NextResponse.json(
          {
            success: false,
            error: `Discount percentage exceeds your limit of ${user.max_discount_percentage}%`
          },
          { status: 400 }
        );
      }
    } else if (discountType === 'Fixed') {
      if (user.max_discount_amount && discountAmount > user.max_discount_amount) {
        return NextResponse.json(
          {
            success: false,
            error: `Discount amount exceeds your limit of $${user.max_discount_amount}`
          },
          { status: 400 }
        );
      }
    }

    // Get current patient to calculate new totals
    const currentPatient = await localPrisma.patient.findUnique({
      where: { id: patientId },
      include: {
        tests: {
          where: { is_deleted: false },
          include: {
            test_template: true
          }
        }
      }
    });

    if (!currentPatient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Calculate test total from existing tests
    const testTotal = currentPatient.tests.reduce((sum, test) => {
      const fees = test.test_template?.fees || 0;
      return sum + fees;
    }, 0);

    const actualFinalTotal = Math.max(0, testTotal - discountAmount);

    // Update patient with discount and recalculate financials
    const updatedPatient = await localPrisma.patient.update({
      where: { id: patientId },
      data: {
        discount_amount: discountAmount,
        discount_percentage: discountPercentage,
        discount_type: discountType,
        discount_reason: discountReason,
        discount_approved_by: session.user.id,
        total_amount: actualFinalTotal,
        amount_due: actualFinalTotal - (currentPatient.amount_paid || 0),
        sync_status: 'Pending',
      },
      include: {
        tests: {
          where: { is_deleted: false },
          include: {
            test_template: true
          }
        }
      }
    });

    // Create discount audit record
    await localPrisma.discountAudit.create({
      data: {
        patient_id: patientId,
        user_id: session.user.id,
        original_total: testTotal,
        discount_amount: discountAmount,
        discount_percentage: discountPercentage,
        discount_type: discountType,
        discount_reason: discountReason,
      }
    });

    const patient = await localPrisma.patient.findUnique({
      where: { id: patientId },
      select: { name: true }
    });

    const patientName = patient?.name;


    // Create audit log
    await localPrisma.auditLog.create({
      data: {
        user_id: session.user.id,
        action: 'APPLY_DISCOUNT',
        entity_type: getTranslatedEntityType('Patient'),
        entity_id: patientId,
        description: 'audit.apply_discount', // Translation key
        translation_params: {
          discount_type: discountType === 'Percentage' ? 'percentage' : 'fixed',
          discount_value: discountType === 'Percentage' ? `${discountPercentage}%` : `$${discountAmount}`,
          patient_name: patientName // You'll need to get patient name
        },
        new_values: {
          discount_amount: discountAmount,
          discount_percentage: discountPercentage,
          discount_type: discountType,
          discount_reason: discountReason,
          total_amount: actualFinalTotal,
          amount_due: actualFinalTotal - (currentPatient.amount_paid || 0)
        },
        created_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedPatient
    });
  } catch (error) {
    console.error('Failed to apply discount:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to apply discount' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { patientId } = body;

    // Get current patient to recalculate totals
    const currentPatient = await localPrisma.patient.findUnique({
      where: { id: patientId },
      include: {
        tests: {
          where: { is_deleted: false },
          include: {
            test_template: true
          }
        }
      }
    });

    if (!currentPatient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Calculate test total
    const testTotal = currentPatient.tests.reduce((sum, test) => {
      const fees = test.test_template?.fees || 0;
      return sum + fees;
    }, 0);

    // Remove discount from patient and update totals
    const updatedPatient = await localPrisma.patient.update({
      where: { id: patientId },
      data: {
        discount_amount: null,
        discount_percentage: null,
        discount_type: null,
        discount_reason: null,
        discount_approved_by: null,
        total_amount: testTotal,
        amount_due: testTotal - (currentPatient.amount_paid || 0),
        sync_status: 'Pending',
      }
    });
    const patient = await localPrisma.patient.findUnique({
      where: { id: patientId },
      select: { name: true }
    });

    const patientName = patient?.name;


    // Create audit log for discount removal
    await localPrisma.auditLog.create({
      data: {
        user_id: session.user.id,
        action: 'REMOVE_DISCOUNT',
        entity_type: getTranslatedEntityType('Patient'),
        entity_id: patientId,
        description: 'audit.remove_discount', // Translation key
        translation_params: {
          patient_name: patientName // You'll need to get patient name
        },
        new_values: {
          discount_amount: null,
          discount_percentage: null,
          discount_type: null,
          discount_reason: null,
          total_amount: testTotal,
          amount_due: testTotal - (currentPatient.amount_paid || 0)
        },
        created_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedPatient
    });
  } catch (error) {
    console.error('Failed to remove discount:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove discount' },
      { status: 500 }
    );
  }
}