// app/api/patients/[id]/tests/filter/route.ts
import { NextResponse } from 'next/server';
import { localPrisma } from '@/app/lib/db/local-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const showArchived = searchParams.get('showArchived') === 'true';

    const whereClause: any = {
      patient_id: patientId,
      is_deleted: false,
    };

    if (!showArchived) {
      whereClause.is_printed = false;
    }

    const tests = await localPrisma.test.findMany({
      where: whereClause,
      include: {
        patient: true,
        doctor: true,
        test_template: {
          include: {
            category: true,
            parameters: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ success: true, data: tests });
  } catch (error) {
    console.error('Error fetching filtered tests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tests' },
      { status: 500 }
    );
  }
}