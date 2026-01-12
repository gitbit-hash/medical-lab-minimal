// app/api/doctors/route.ts
import { NextResponse } from 'next/server';
import { offlineQueue } from '../../lib/sync/offline-queue';
import { localPrisma } from '@/app/lib/db/local-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search') || '';
    const specialization = searchParams.get('specialization');

    const skip = (page - 1) * limit;

    let where: any = { is_deleted: false };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { clinic_address: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (specialization) {
      where.specialization = specialization;
    }

    const [doctors, totalCount] = await Promise.all([
      localPrisma.doctor.findMany({
        where,
        include: {
          patients: {
            where: {
              patient: {
                is_deleted: false  // Filter out deleted patients
              }
            },
            include: {
              patient: {
                select: {
                  id: true,
                  name: true,
                  is_deleted: true  // Include to verify filtering works
                }
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      localPrisma.doctor.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: doctors,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Failed to fetch doctors:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch doctors'
      },
      { status: 500 }
    );
  }
}