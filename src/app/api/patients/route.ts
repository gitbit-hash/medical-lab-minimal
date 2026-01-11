// app/api/patients/route.ts
import { NextResponse } from 'next/server';
import { ApiResponse } from '../../types';
import { localPrisma } from '../../lib/db/local-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/auth-options';
import { getTranslatedEntityType } from '@/app/lib/audit/get-translated-entity-type';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search') || '';
    const doctorId = searchParams.get('doctorId');
    const dateFilter = searchParams.get('dateFilter');
    const sort = searchParams.get('sort') || 'newest';

    const skip = (page - 1) * limit;

    // Build where clause
    let where: any = { is_deleted: false };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (doctorId) {
      where.doctors = {
        some: {
          doctor_id: doctorId
        }
      };
    }

    if (dateFilter) {
      const date = new Date();
      switch (dateFilter) {
        case 'today':
          date.setHours(0, 0, 0, 0);
          where.created_at = { gte: date };
          break;
        case 'week':
          date.setDate(date.getDate() - 7);
          where.created_at = { gte: date };
          break;
        case 'month':
          date.setMonth(date.getMonth() - 1);
          where.created_at = { gte: date };
          break;
      }
    }

    // Build orderBy clause based on sort parameter
    let orderBy: any = {};
    switch (sort) {
      case 'newest':
        orderBy = { created_at: 'desc' };
        break;
      case 'oldest':
        orderBy = { created_at: 'asc' };
        break;
      case 'name-asc':
        orderBy = { name: 'asc' };
        break;
      case 'name-desc':
        orderBy = { name: 'desc' };
        break;
      default:
        orderBy = { created_at: 'desc' };
    }

    // Get patients with pagination
    const [patients, totalCount] = await Promise.all([
      localPrisma.patient.findMany({
        where,
        include: {
          doctors: {
            include: {
              doctor: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      localPrisma.patient.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: patients,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Failed to fetch patients:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch patients'
      },
      { status: 500 }
    );
  }
}

// app/api/patients/route.ts - POST handler
// Add this helper function at the top
const getCurrencySymbol = (locale: string = 'en') => {
  // You might want to make this configurable
  return '$';
};

export async function POST(request: Request): Promise<NextResponse<ApiResponse<any>>> {
  try {
    // Get the session to know who's creating the patient
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: any = await request.json();
    const {
      name,
      gender,
      age_value,
      age_unit,
      phone,
      email,
      address,
      doctorIds,
      tests = [],
      amount_paid = 0,
      amount_due = 0,
      payment_status = 'Unpaid',
      discount_amount = 0,
      discount_percentage = 0,
      discount_type = null,
      discount_reason = null,
      payment_method = null,
      receipt_number = null
    } = body;

    // Basic validation
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Patient name is required' },
        { status: 400 }
      );
    }

    const result = await localPrisma.$transaction(async (prisma) => {
      // 1. Create the patient
      const patient = await prisma.patient.create({
        data: {
          name: name.trim(),
          gender,
          age_value: age_value ? parseFloat(age_value) : null,
          age_unit: age_unit || null,
          phone: phone?.trim() || null,
          email: email?.trim() || null,
          address: address?.trim() || null,
          total_amount: 0,
          amount_due: amount_due,
          amount_paid: amount_paid,
          payment_status: payment_status,
          payment_method: payment_method,
          receipt_number: receipt_number,
          current_visit_number: 1,
          sync_status: 'Pending',
          discount_amount: discount_amount,
          discount_percentage: discount_percentage,
          discount_type: discount_type,
          discount_reason: discount_reason,
        },
      });

      // 2. Create audit log for patient creation
      await prisma.auditLog.create({
        data: {
          user_id: session.user.id,
          action: 'CREATE_PATIENT',
          entity_type: getTranslatedEntityType('Patient'),
          entity_id: patient.id,
          description: 'audit.create_patient',
          translation_params: {
            patient_name: patient.name,
            amount_paid: amount_paid.toFixed(2),
            amount_due: amount_due.toFixed(2),
            currency: getCurrencySymbol(),
            discount_amount: discount_amount ? discount_amount.toFixed(2) : '0'
          },
          new_values: {
            name: patient.name,
            gender: patient.gender,
            age_value: patient.age_value,
            age_unit: patient.age_unit,
            amount_paid: amount_paid,
            amount_due: amount_due,
            payment_status: payment_status,
            discount_amount: discount_amount
          },
          created_at: new Date(),
        },
      });

      // 3. Create initial visit for the patient
      const initialVisit = await prisma.patientVisit.create({
        data: {
          patient_id: patient.id,
          visit_date: new Date(),
          visit_number: 1,
          notes: 'Initial consultation',
          total_amount: 0,
          amount_paid: amount_paid,
          amount_due: amount_due,
          payment_status: payment_status,
          payment_method: payment_method,
          receipt_number: receipt_number,
          discount_amount: discount_amount,
          discount_percentage: discount_percentage,
          discount_type: discount_type,
          discount_reason: discount_reason,
        }
      });

      // 4. Create audit log for visit creation
      await prisma.auditLog.create({
        data: {
          user_id: session.user.id,
          action: 'CREATE_VISIT',
          entity_type: getTranslatedEntityType('PatientVisit'),
          entity_id: initialVisit.id,
          description: 'audit.create_visit',
          translation_params: {
            patient_name: patient.name,
            visit_number: initialVisit.visit_number,
            amount_paid: amount_paid.toFixed(2),
            amount_due: amount_due.toFixed(2),
            currency: getCurrencySymbol(),
            discount_amount: discount_amount ? discount_amount.toFixed(2) : '0'
          },
          new_values: {
            visit_number: initialVisit.visit_number,
            total_amount: 0,
            amount_paid: amount_paid,
            amount_due: amount_due,
            payment_status: payment_status
          },
          created_at: new Date(),
        },
      });

      // 5. Handle doctor relationships
      if (doctorIds && doctorIds.length > 0) {
        for (const doctorId of doctorIds) {
          await prisma.patientDoctor.create({
            data: {
              patient_id: patient.id,
              doctor_id: doctorId,
              sync_status: 'Pending',
            },
          });
        }

        // Create audit log for doctor assignment
        await prisma.auditLog.create({
          data: {
            user_id: session.user.id,
            action: 'ASSIGN_DOCTORS',
            entity_type: getTranslatedEntityType('Patient'),
            entity_id: patient.id,
            description: 'audit.assign_doctors',
            translation_params: {
              patient_name: patient.name,
              doctors_count: doctorIds.length.toString()
            },
            new_values: {
              doctor_ids: doctorIds
            },
            created_at: new Date(),
          },
        });
      }

      // 6. Create tests if provided and link to the visit
      let visitTotalFees = 0;
      if (tests && tests.length > 0) {
        const createdTests = [];

        for (const testData of tests) {
          // Get template fees
          let fees = 0;
          if (testData.test_template_id) {
            const template = await prisma.testTemplate.findUnique({
              where: { id: testData.test_template_id },
              select: { fees: true }
            });
            fees = template?.fees || 0;
          }

          const test = await prisma.test.create({
            data: {
              patient_id: patient.id,
              visit_id: initialVisit.id,
              test_template_id: testData.test_template_id,
              test_type: testData.test_type,
              test_code: testData.test_code,
              status: 'Pending',
              sync_status: 'Pending',
              visit_number: 1,
            }
          });

          createdTests.push(test);
          visitTotalFees += fees;

          // Create audit log for test creation
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
                test_code: testData.test_code || 'N/A'
              },
              new_values: {
                test_type: testData.test_type,
                test_code: testData.test_code,
                status: 'Pending'
              },
              created_at: new Date(),
            },
          });
        }

        // Create audit log for batch test creation
        await prisma.auditLog.create({
          data: {
            user_id: session.user.id,
            action: 'CREATE_TESTS_BATCH',
            entity_type: getTranslatedEntityType('Patient'),
            entity_id: patient.id,
            description: 'audit.create_tests_batch',
            translation_params: {
              patient_name: patient.name,
              tests_count: tests.length.toString(),
              total_fees: visitTotalFees.toFixed(2),
              currency: getCurrencySymbol()
            },
            new_values: {
              tests_count: tests.length,
              total_fees: visitTotalFees
            },
            created_at: new Date(),
          },
        });
      }

      // 7. Update visit with calculated financials
      const finalVisitTotal = Math.max(0, visitTotalFees - discount_amount);
      const updatedVisit = await prisma.patientVisit.update({
        where: { id: initialVisit.id },
        data: {
          total_amount: finalVisitTotal,
          discount_amount: discount_amount,
          discount_percentage: discount_percentage,
          discount_type: discount_type,
          discount_reason: discount_reason,
          amount_due: finalVisitTotal - amount_paid,
          amount_paid: amount_paid,
          payment_status: finalVisitTotal - amount_paid === 0 ? 'Paid' :
            amount_paid > 0 ? 'PartiallyPaid' : 'Unpaid'
        }
      });

      // 8. Update patient with aggregated financials
      const updatedPatient = await prisma.patient.update({
        where: { id: patient.id },
        data: {
          total_amount: finalVisitTotal,
          discount_amount: discount_amount,
          discount_percentage: discount_percentage,
          discount_type: discount_type,
          discount_reason: discount_reason,
          discount_approved_by: body.discount_approved_by,
          amount_paid: amount_paid,
          amount_due: finalVisitTotal - amount_paid,
          payment_status: finalVisitTotal - amount_paid === 0 ? 'Paid' :
            amount_paid > 0 ? 'PartiallyPaid' : 'Unpaid'
        },
        include: {
          doctors: {
            include: {
              doctor: true,
            },
          },
          visits: {
            where: { id: initialVisit.id },
            include: {
              tests: true
            }
          }
        }
      });

      // 9. Create discount audit log if discount was applied
      if (discount_amount > 0) {
        await prisma.auditLog.create({
          data: {
            user_id: session.user.id,
            action: 'APPLY_DISCOUNT',
            entity_type: getTranslatedEntityType('Patient'),
            entity_id: patient.id,
            description: 'audit.apply_discount',
            translation_params: {
              patient_name: patient.name,
              discount_type: discount_type === 'Percentage' ? 'percentage' : 'fixed',
              discount_value: discount_type === 'Percentage' ?
                `${discount_percentage}%` :
                `${getCurrencySymbol()}${discount_amount.toFixed(2)}`
            },
            new_values: {
              discount_amount: discount_amount,
              discount_percentage: discount_percentage,
              discount_type: discount_type,
              discount_reason: discount_reason,
              total_amount: finalVisitTotal,
              amount_due: finalVisitTotal - amount_paid
            },
            created_at: new Date(),
          },
        });
      }

      // 10. Create payment audit log if payment was made
      if (amount_paid > 0) {
        await prisma.auditLog.create({
          data: {
            user_id: session.user.id,
            action: 'PAYMENT_RECEIVED',
            entity_type: getTranslatedEntityType('Patient'),
            entity_id: patient.id,
            description: 'audit.payment_received',
            translation_params: {
              patient_name: patient.name,
              amount_paid: amount_paid.toFixed(2),
              amount_due: (finalVisitTotal - amount_paid).toFixed(2),
            },
            new_values: {
              amount_paid: amount_paid,
              amount_due: finalVisitTotal - amount_paid,
              payment_status: finalVisitTotal - amount_paid === 0 ? 'Paid' :
                amount_paid > 0 ? 'PartiallyPaid' : 'Unpaid',
              receipt_number: receipt_number
            },
            created_at: new Date(),
          },
        });
      }

      return {
        patient: updatedPatient,
        visit: updatedVisit
      };
    });

    // Return patient with visit info
    return NextResponse.json({
      success: true,
      data: {
        patient: result.patient,
        visit: result.visit
      },
    });
  } catch (error) {
    console.error('Failed to create patient:', error);

    let errorMessage = 'Failed to create patient';
    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        errorMessage = 'Patient with similar details already exists';
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

