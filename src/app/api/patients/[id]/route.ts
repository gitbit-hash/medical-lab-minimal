// app/api/patients/[id]/route.ts
import { NextResponse } from 'next/server';
import { localPrisma } from '../../../lib/db/local-client';
import { ApiResponse } from '../../../types';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth-options';
import { Prisma } from '@prisma/client';
import { getTranslatedEntityType } from '@/app/lib/audit/get-translated-entity-type';

const getCurrencySymbol = () => '$';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { id } = await params;
    const patient = await localPrisma.patient.findUnique({
      where: { id },
      include: {
        doctors: {
          include: {
            doctor: true,
          },
        },
        tests: {
          where: { is_deleted: false },
          include: {
            doctor: true,
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!patient || patient.is_deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Patient not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error('Failed to fetch patient:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch patient'
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
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const { name, gender, age_value, age_unit, phone, email, address, doctorIds, tests, selectedTests } = body;



    const result = await localPrisma.$transaction(async (tx) => {

      // Get current patient data before update
      const currentPatient = await tx.patient.findUnique({
        where: { id },
        select: {
          name: true,
          gender: true,
          age_value: true,
          age_unit: true,
          phone: true,
          email: true,
          address: true
        }
      });

      // 1️⃣ Update patient info
      const patient = await tx.patient.update({
        where: { id },
        data: {
          name,
          gender,
          age_value: age_value ? parseFloat(age_value) : null,
          age_unit: age_unit || null,
          phone,
          email,
          address,
          sync_status: 'Pending',
        },
      });

      // Create audit log for patient update
      await tx.auditLog.create({
        data: {
          user_id: session.user.id,
          action: 'UPDATE_PATIENT',
          entity_type: getTranslatedEntityType('User'),
          entity_id: id,
          description: 'audit.update_patient',
          translation_params: {
            patient_name: patient.name
          },
          old_values: currentPatient as Prisma.InputJsonValue,
          new_values: {
            name: patient.name,
            gender: patient.gender,
            age_value: patient.age_value,
            age_unit: patient.age_unit,
            phone: patient.phone,
            email: patient.email,
            address: patient.address
          },
          created_at: new Date(),
        },
      });

      // 2️⃣ Update doctor relationships
      if (doctorIds) {

        const currentDoctors = await tx.patientDoctor.findMany({
          where: { patient_id: id },
          select: { doctor_id: true }
        });

        await tx.patientDoctor.deleteMany({ where: { patient_id: id } });

        if (doctorIds.length > 0) {
          await tx.patientDoctor.createMany({
            data: doctorIds.map((doctorId: string) => ({
              patient_id: id,
              doctor_id: doctorId,
              sync_status: 'Pending',
            })),
          });
        }
        await tx.auditLog.create({
          data: {
            user_id: session.user.id,
            action: 'UPDATE_DOCTORS',
            entity_type: getTranslatedEntityType('Patient'),
            entity_id: id,
            description: 'audit.update_doctors',
            translation_params: {
              patient_name: patient.name,
              old_count: currentDoctors.length,
              new_count: doctorIds.length
            },
            old_values: { doctor_ids: currentDoctors.map(d => d.doctor_id) },
            new_values: { doctor_ids: doctorIds },
            created_at: new Date(),
          },
        });
      }

      const newTests = tests || selectedTests || [];

      // 3️⃣ Handle tests - CRITICAL FIX: Don't delete existing tests!
      // Only process if there are new tests to add
      if (newTests.length > 0) {
        for (const t of newTests) {
          // Try to find an existing template by ID, code, or name
          let template = null;

          if (t.test_template_id) {
            template = await tx.testTemplate.findUnique({
              where: { id: t.test_template_id },
              include: { category: true },
            });
          }

          if (!template && t.test_code) {
            template = await tx.testTemplate.findUnique({
              where: { code: t.test_code },
              include: { category: true },
            });
          }

          if (!template && t.test_type) {
            template = await tx.testTemplate.findFirst({
              where: { name: { equals: t.test_type, mode: 'insensitive' } },
              include: { category: true },
            });
          }

          // 🧩 If no template found, create synthetic one
          if (!template) {
            const category = await tx.testCategory.upsert({
              where: { name: 'Uncategorized' },
              create: { name: 'Uncategorized', description: 'Auto-created category', is_active: true },
              update: {},
            });

            template = await tx.testTemplate.create({
              data: {
                name: t.test_type || 'Unnamed Test',
                code: t.test_code || t.test_type || `T-${Date.now()}`,
                category_id: category.id,
                fees: t.fees || 0,
                specimen: 'Serum',
                container: 'Standard Tube',
                turnaround_time: '6h',
                is_active: true,
              },
              include: { category: true },
            });
          }

          // ✅ CRITICAL: Check if this exact test already exists
          // We want to allow duplicates of archived tests
          const existingTest = await tx.test.findFirst({
            where: {
              patient_id: id,
              test_template_id: template.id,
              test_type: template.name,
              is_deleted: false,
              // Check if it's NOT archived
              is_printed: false,
            },
          });

          // Only create a new test if:
          // 1. It doesn't exist at all OR
          // 2. The existing test is archived (is_printed: true)
          if (!existingTest) {
            const newTest = await tx.test.create({
              data: {
                patient_id: id,
                test_template_id: template.id,
                test_type: template.name,
                test_code: template.code,
                referring_doctor_id: t.referring_doctor_id || null,
                status: 'Pending',
                sync_status: 'Pending',
                is_deleted: false,
              },
            });

            await tx.auditLog.create({
              data: {
                user_id: session.user.id,
                action: 'ADD_TEST',
                entity_type: getTranslatedEntityType('Patient'),
                entity_id: id,
                description: 'audit.add_test',
                translation_params: {
                  patient_name: patient.name,
                  test_name: template.name
                },
                new_values: {
                  test_id: newTest.id,
                  test_type: template.name,
                  test_code: template.code
                },
                created_at: new Date(),
              },
            });
          }
          // If existing test is not archived (is_printed: false), do nothing
          // This prevents duplicate non-archived tests
        }
      }

      // 4️⃣ Return updated patient with ALL tests (archived + non-archived)
      return tx.patient.findUnique({
        where: { id },
        include: {
          doctors: { include: { doctor: true } },
          tests: {
            where: { is_deleted: false },
            include: {
              doctor: true,
              test_template: { include: { category: true, parameters: true } },
            },
            orderBy: { created_at: 'desc' },
          },
        },
      });
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Failed to update patient:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update patient' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // First, check if patient exists and is not already deleted
    const existingPatient = await localPrisma.patient.findUnique({
      where: { id },
      include: {
        tests: {
          where: { is_deleted: false }
        }
      }
    });

    if (!existingPatient) {
      return NextResponse.json(
        {
          success: false,
          error: 'Patient not found'
        },
        { status: 404 }
      );
    }

    if (existingPatient.is_deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Patient already deleted'
        },
        { status: 400 }
      );
    }

    // Use transaction to ensure both patient and tests are updated atomically
    const result = await localPrisma.$transaction(async (tx) => {
      // Soft delete all tests for this patient
      if (existingPatient.tests.length > 0) {
        await tx.test.updateMany({
          where: {
            patient_id: id,
            is_deleted: false
          },
          data: {
            is_deleted: true,
            sync_status: 'Pending',
          },
        });
      }

      // Soft delete the patient
      const deletedPatient = await tx.patient.update({
        where: { id },
        data: {
          is_deleted: true,
          sync_status: 'Pending',
        },
      });

      await tx.auditLog.create({
        data: {
          user_id: session.user.id,
          action: 'DELETE_PATIENT',
          entity_type: getTranslatedEntityType('Patient'),
          entity_id: id,
          description: 'audit.delete_patient',
          translation_params: {
            patient_name: existingPatient.name,
            tests_deleted: existingPatient.tests.length
          },
          old_values: {
            name: existingPatient.name,
            gender: existingPatient.gender,
            tests_count: existingPatient.tests.length
          },
          created_at: new Date(),
        },
      });

      return deletedPatient;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Patient and associated tests deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete patient:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete patient'
      },
      { status: 500 }
    );
  }
}