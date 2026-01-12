// app/api/doctors/[id]/route.ts
import { localPrisma } from '../../../lib/db/local-client';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params
  try {
    const doctor = await localPrisma.doctor.findUnique({
      where: { id },
      include: {
        patients: {
          where: {
            patient: {
              is_deleted: false  // Filter out deleted patients
            }
          },
          include: {
            patient: {
              include: {
                tests: {
                  where: { is_deleted: false },
                  orderBy: { created_at: 'desc' }
                }
              }
            },
          },
        },
      },
    });

    if (!doctor || doctor.is_deleted) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json(doctor);
  } catch (error) {
    console.error('Failed to fetch doctor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctor' },
      { status: 500 }
    );
  }
}