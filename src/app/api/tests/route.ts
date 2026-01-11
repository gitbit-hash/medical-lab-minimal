// app/api/tests/route.ts
import { NextResponse } from 'next/server';
import { offlineQueue } from '../../lib/sync/offline-queue';
import { TestFormData, ApiResponse } from '../../types';
import { localPrisma } from '@/app/lib/db/local-client';
import { updateVisitFinancials } from '@/app/lib/utils/financial-sync';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');
    const dateFilter = searchParams.get('dateFilter');

    const skip = (page - 1) * limit;

    let where: any = {
      is_deleted: false,
      patient: {
        is_deleted: false
      }
    };

    if (search) {
      where.OR = [
        { test_type: { contains: search, mode: 'insensitive' } },
        { test_code: { contains: search, mode: 'insensitive' } },
        { units: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (patientId) {
      where.patient_id = patientId;
    }

    if (doctorId) {
      where.referring_doctor_id = doctorId;
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

    const [tests, totalCount] = await Promise.all([
      localPrisma.test.findMany({
        where,
        include: {
          patient: true,
          doctor: true,
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      localPrisma.test.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: tests,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Failed to fetch tests:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tests'
      },
      { status: 500 }
    );
  }
}

// app/api/tests/route.ts - POST handler
export async function POST(request: Request): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const body: any = await request.json();
    const {
      patient_id,
      test_type,
      test_code,
      test_template_id,
      status = 'Pending',
      visit_id, // Add visit_id parameter
      // ... other fields
    } = body;

    // Get patient to find current visit if visit_id not provided
    let finalVisitId = visit_id;
    let visitNumber = 1;

    if (!finalVisitId) {
      const patient = await localPrisma.patient.findUnique({
        where: { id: patient_id },
        include: {
          visits: {
            orderBy: { visit_number: 'desc' },
            take: 1
          }
        }
      });

      if (patient?.visits && patient.visits.length > 0) {
        finalVisitId = patient.visits[0].id;
        visitNumber = patient.visits[0].visit_number;
      } else {
        // Create a visit for the patient if none exists
        const newVisit = await localPrisma.patientVisit.create({
          data: {
            patient_id: patient_id,
            visit_date: new Date(),
            visit_number: 1,
            notes: 'Test consultation',
          }
        });
        finalVisitId = newVisit.id;
        visitNumber = 1;

        // Update patient's visit number
        await localPrisma.patient.update({
          where: { id: patient_id },
          data: { current_visit_number: 1 }
        });
      }
    } else {
      // Get visit number from provided visit_id
      const visit = await localPrisma.patientVisit.findUnique({
        where: { id: finalVisitId },
        select: { visit_number: true }
      });
      visitNumber = visit?.visit_number || 1;
    }

    // Check for existing identical tests to prevent duplicates
    const existingTest = await localPrisma.test.findFirst({
      where: {
        patient_id,
        test_template_id: test_template_id || undefined,
        test_type,
        visit_id: finalVisitId,
        is_deleted: false,
      },
    });

    if (existingTest) {
      return NextResponse.json({
        success: true,
        data: existingTest,
      });
    }

    // Get test template fees
    let fees = 0;
    if (test_template_id) {
      const template = await localPrisma.testTemplate.findUnique({
        where: { id: test_template_id },
        select: { fees: true }
      });
      fees = template?.fees || 0;
    }

    // Use offline queue to handle test creation with visit linkage
    const test = await offlineQueue.addTest({
      patient_id,
      referring_doctor_id: body.referring_doctor_id || null,
      test_type,
      test_code: test_code || null,
      test_template_id: test_template_id || null,
      status,
      results: body.results || null,
      normal_range: body.normal_range || null,
      units: body.units || null,
      tested_at: body.tested_at ? new Date(body.tested_at) : null,
      completed_at: body.completed_at ? new Date(body.completed_at) : null,
      visit_id: finalVisitId, // Link to visit
      visit_number: visitNumber,
    });

    // Update visit financials
    if (finalVisitId) {
      await updateVisitFinancials(finalVisitId);
    }

    return NextResponse.json({
      success: true,
      data: test,
    });
  } catch (error) {
    console.error('❌ Failed to create test:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create test'
      },
      { status: 500 }
    );
  }
}

