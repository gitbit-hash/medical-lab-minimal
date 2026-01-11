// app/api/patients/search/route.ts
import { NextResponse } from 'next/server';
import { localPrisma } from '../../../lib/db/local-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/auth-options';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user?.role !== "SuperAdmin" && session.user?.role !== "Admin")) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';

    if (query.length < 3) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // Search for patients by name
    const patients = await localPrisma.patient.findMany({
      where: {
        AND: [
          { is_deleted: false },
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        age_value: true,
        age_unit: true,
        gender: true,
        phone: true,
      },
      take: 10, // Limit to 10 results
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      data: patients
    });
  } catch (error) {
    console.error('Failed to search patients:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search patients'
      },
      { status: 500 }
    );
  }
}