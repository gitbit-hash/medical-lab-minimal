// app/api/patients/[id]/visits/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from '@/app/lib/db/local-client';
import { getTranslatedEntityType } from '@/app/lib/audit/get-translated-entity-type';

// Helper function to get currency symbol
const getCurrencySymbol = () => '$'; // Adjust based on your currency logic


export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      visit_date,
      notes,
      doctorIds,
      tests,
      discount,
      paymentInfo
    } = body;

    // Validate doctorIds - ensure they're valid if provided
    if (doctorIds && Array.isArray(doctorIds)) {
      // Check if all doctor IDs exist
      const existingDoctors = await localPrisma.doctor.findMany({
        where: {
          id: { in: doctorIds },
          is_deleted: false
        },
        select: { id: true }
      });

      const existingDoctorIds = existingDoctors.map(d => d.id);
      const invalidDoctorIds = doctorIds.filter(id => !existingDoctorIds.includes(id));

      if (invalidDoctorIds.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid doctor IDs: ${invalidDoctorIds.join(', ')}`
          },
          { status: 400 }
        );
      }
    }


    const result = await localPrisma.$transaction(async (prisma) => {
      // 1. Get patient and their current visit number
      const patient = await prisma.patient.findUnique({
        where: { id: patientId, is_deleted: false },
      });

      if (!patient) {
        throw new Error('Patient not found');
      }

      // Calculate new visit number
      const newVisitNumber = (patient.current_visit_number || 0) + 1;

      // 2. Create the visit with initial financials
      const visit = await prisma.patientVisit.create({
        data: {
          patient_id: patientId,
          visit_date: visit_date ? new Date(visit_date) : new Date(),
          visit_number: newVisitNumber,
          notes: notes || null,

          // Initial financials - will be calculated based on tests
          total_amount: 0,
          discount_amount: discount?.amount || 0,
          discount_percentage: discount?.percentage || 0,
          discount_type: discount?.type || null,
          discount_reason: discount?.reason || null,
          amount_paid: paymentInfo?.amount_paid || 0,
          amount_due: paymentInfo?.amount_due || 0,
          payment_status: paymentInfo?.payment_status || 'Unpaid',
          payment_method: paymentInfo?.method || null,
          receipt_number: paymentInfo?.receipt_number || null,
        }
      });

      // 3. Update patient's visit number
      await prisma.patient.update({
        where: { id: patientId },
        data: {
          current_visit_number: newVisitNumber
        }
      });

      // 4. AUDIT LOG: CREATE_VISIT
      await prisma.auditLog.create({
        data: {
          user_id: session.user.id,
          action: 'CREATE_VISIT',
          entity_type: getTranslatedEntityType('PatientVisit'),
          entity_id: visit.id,
          description: 'audit.create_visit',
          translation_params: {
            patient_name: patient.name,
            visit_number: newVisitNumber.toString(),
            amount_paid: (paymentInfo?.amount_paid || 0).toFixed(2),
            amount_due: (paymentInfo?.amount_due || 0).toFixed(2),
            currency: getCurrencySymbol(),
            discount_amount: (discount?.amount || 0).toFixed(2)
          },
          new_values: {
            visit_number: newVisitNumber,
            total_amount: 0,
            amount_paid: paymentInfo?.amount_paid || 0,
            amount_due: paymentInfo?.amount_due || 0,
            payment_status: paymentInfo?.payment_status || 'Unpaid'
          },
          created_at: new Date(),
        },
      });

      // 5. Handle doctor assignments
      if (doctorIds && doctorIds.length > 0) {
        // Create VisitDoctor relationships instead of PatientDoctor
        for (const doctorId of doctorIds) {
          await prisma.visitDoctor.create({
            data: {
              visit_id: visit.id, // Link to the visit, not the patient
              doctor_id: doctorId,
              sync_status: 'Pending',
            },
          });
        }

        // AUDIT LOG: ASSIGN_DOCTORS
        await prisma.auditLog.create({
          data: {
            user_id: session.user.id,
            action: 'ASSIGN_DOCTORS',
            entity_type: getTranslatedEntityType('Patient'),
            entity_id: visit.id,
            description: 'audit.assign_doctors',
            translation_params: {
              patient_name: patient.name,
              doctors_count: doctorIds.length.toString()
            },
            new_values: {
              doctor_ids: doctorIds,
              visit_number: newVisitNumber
            },
            created_at: new Date(),
          },
        });
      }

      // 6. Create tests and calculate total fees
      let visitTotalFees = 0;
      const createdTests = [];

      if (tests && tests.length > 0) {
        // Get template fees for all tests
        const templateIds = tests
          .map((test: any) => test.test_template_id)
          .filter(Boolean) as string[];

        const templateFeeMap = new Map();

        if (templateIds.length > 0) {
          const templates = await prisma.testTemplate.findMany({
            where: { id: { in: templateIds } },
            select: { id: true, fees: true }
          });

          templates.forEach(t => templateFeeMap.set(t.id, t.fees || 0));
        }

        // Create each test
        for (const testData of tests) {
          const fees = testData.test_template_id ?
            templateFeeMap.get(testData.test_template_id) || 0 : 0;

          const test = await prisma.test.create({
            data: {
              patient_id: patientId,
              visit_id: visit.id,
              test_template_id: testData.test_template_id,
              test_type: testData.test_type,
              test_code: testData.test_code,
              status: 'Pending',
              sync_status: 'Pending',
              visit_number: newVisitNumber,
            }
          });

          createdTests.push(test);
          visitTotalFees += fees;

          // AUDIT LOG: CREATE_TEST (for each test)
          await prisma.auditLog.create({
            data: {
              user_id: session.user.id,
              action: 'CREATE_TEST',
              entity_type: getTranslatedEntityType('Test'),
              entity_id: test.id,
              description: 'audit.create_test',
              translation_params: {
                patient_name: patient.name,
                test_name: testData.test_type,
                test_code: testData.test_code || 'N/A',
                visit_number: newVisitNumber.toString()
              },
              new_values: {
                test_type: testData.test_type,
                test_code: testData.test_code,
                status: 'Pending',
                visit_number: newVisitNumber
              },
              created_at: new Date(),
            },
          });
        }

        // AUDIT LOG: CREATE_TESTS_BATCH
        await prisma.auditLog.create({
          data: {
            user_id: session.user.id,
            action: 'CREATE_TESTS_BATCH',
            entity_type: getTranslatedEntityType('Patient'),
            entity_id: patientId,
            description: 'audit.create_tests_batch',
            translation_params: {
              patient_name: patient.name,
              tests_count: tests.length.toString(),
              total_fees: visitTotalFees.toFixed(2),
              currency: getCurrencySymbol(),
              visit_number: newVisitNumber.toString()
            },
            new_values: {
              tests_count: tests.length,
              total_fees: visitTotalFees
            },
            created_at: new Date(),
          },
        });
      }

      // 7. Apply discount calculations
      const discountAmount = discount?.amount || 0;
      const finalTotal = Math.max(0, visitTotalFees - discountAmount);
      const amountPaid = paymentInfo?.amount_paid || 0;
      const amountDue = finalTotal - amountPaid;
      const paymentStatus = amountDue === 0 ? 'Paid' :
        amountPaid > 0 ? 'PartiallyPaid' : 'Unpaid';

      // Update visit with correct financials
      const updatedVisit = await prisma.patientVisit.update({
        where: { id: visit.id },
        data: {
          total_amount: finalTotal,
          discount_amount: discountAmount,
          discount_percentage: discount?.percentage || 0,
          discount_type: discount?.type || null,
          discount_reason: discount?.reason || null,
          amount_due: amountDue,
          payment_status: paymentStatus
        }
      });

      // 8. AUDIT LOG: APPLY_DISCOUNT (if discount applied)
      if (discountAmount > 0) {
        await prisma.auditLog.create({
          data: {
            user_id: session.user.id,
            action: 'APPLY_DISCOUNT',
            entity_type: getTranslatedEntityType('PatientVisit'),
            entity_id: visit.id,
            description: 'audit.apply_discount',
            translation_params: {
              patient_name: patient.name,
              discount_type: discount?.type === 'Percentage' ? 'percentage' : 'fixed',
              discount_value: discount?.type === 'Percentage' ?
                `${discount?.percentage}%` :
                `${getCurrencySymbol()}${discountAmount.toFixed(2)}`,
              visit_number: newVisitNumber.toString()
            },
            new_values: {
              discount_amount: discountAmount,
              discount_percentage: discount?.percentage || 0,
              discount_type: discount?.type || null,
              discount_reason: discount?.reason || null,
              total_amount: finalTotal,
              amount_due: amountDue
            },
            created_at: new Date(),
          },
        });
      }

      // 9. AUDIT LOG: VISIT_PAYMENT (if payment made)
      if (amountPaid > 0) {
        await prisma.auditLog.create({
          data: {
            user_id: session.user.id,
            action: 'VISIT_PAYMENT',
            entity_type: getTranslatedEntityType('Visit'), // Using 'Visit' for VISIT_PAYMENT
            entity_id: visit.id,
            description: 'audit.visit_payment',
            translation_params: {
              patient_name: patient.name,
              visit_number: newVisitNumber.toString(),
              amount_paid: amountPaid.toFixed(2),
              currency: getCurrencySymbol()
            },
            new_values: {
              visit_number: newVisitNumber,
              amount_paid: amountPaid,
              payment_method: paymentInfo?.method || null,
              receipt_number: paymentInfo?.receipt_number || null
            },
            created_at: new Date(),
          },
        });
      }

      // 10. Update patient's overall financials
      // Get all non-cancelled tests for patient
      const allPatientTests = await prisma.test.findMany({
        where: {
          patient_id: patientId,
          is_deleted: false,
          status: { not: 'Cancelled' }
        },
        include: { test_template: true }
      });

      // Get template fees for all tests
      const allTemplateIds = allPatientTests
        .map(t => t.test_template_id)
        .filter(Boolean) as string[];

      let patientTotalFees = 0;

      if (allTemplateIds.length > 0) {
        const allTemplates = await prisma.testTemplate.findMany({
          where: { id: { in: allTemplateIds } },
          select: { id: true, fees: true }
        });

        const allTemplateFeeMap = new Map(
          allTemplates.map(t => [t.id, t.fees || 0])
        );

        patientTotalFees = allPatientTests.reduce((sum, test) => {
          const fees = test.test_template_id ?
            allTemplateFeeMap.get(test.test_template_id) || 0 : 0;
          return sum + fees;
        }, 0);
      }

      // Get all visits for patient to calculate overall financials
      const allVisits = await prisma.patientVisit.findMany({
        where: { patient_id: patientId }
      });

      const totalDiscounts = allVisits.reduce((sum, visit) => sum + (visit.discount_amount || 0), 0);
      const totalPaid = allVisits.reduce((sum, visit) => sum + (visit.amount_paid || 0), 0);
      const totalDue = (patientTotalFees - totalDiscounts) - totalPaid;

      // Update patient financials
      await prisma.patient.update({
        where: { id: patientId },
        data: {
          total_amount: patientTotalFees - totalDiscounts,
          discount_amount: totalDiscounts,
          amount_paid: totalPaid,
          amount_due: totalDue,
          payment_status: totalDue === 0 ? 'Paid' : totalPaid > 0 ? 'PartiallyPaid' : 'Unpaid'
        }
      });

      return {
        patient: {
          id: patientId,
          name: patient.name,
          current_visit_number: newVisitNumber,
          amount_due: totalDue
        },
        visit: updatedVisit,
        tests: createdTests
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        visit: result.visit,
        patient: {
          current_visit_number: result.patient.current_visit_number,
          amount_due: result.patient.amount_due
        },
        tests: result.tests
      }
    });
  } catch (error) {
    console.error('Failed to create visit:', error);

    if (error instanceof Error && error.message === 'Patient not found') {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create visit' },
      { status: 500 }
    );
  }
}