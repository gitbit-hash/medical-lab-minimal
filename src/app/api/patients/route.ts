// app/api/patients/route.ts
import { NextResponse } from 'next/server';
import { ApiResponse } from '../../types';
import { localPrisma } from '../../lib/db/local-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/auth-options';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search') || '';
    const doctorId = searchParams.get('doctorId');
    const dateFilter = searchParams.get('dateFilter');
    const sort = searchParams.get('sort') || 'newest';

    const skip = (page - 1) * limit;

    // Build where clause
    let where: any = {
      is_deleted: false,
      user_id: session.user.id
    };

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

    // Check if user already has a patient
    const existingPatient = await localPrisma.patient.findFirst({
      where: {
        user_id: session.user.id,
        is_deleted: false
      }
    });

    if (existingPatient) {
      return NextResponse.json(
        { success: false, error: 'You can only create one patient.' },
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
          user_id: session.user.id,
          discount_amount: discount_amount,
          discount_percentage: discount_percentage,
          discount_type: discount_type,
          discount_reason: discount_reason,
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
        }
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

