import { localPrisma } from "@/app/lib/db/local-client";
import { NextResponse } from "next/server";

// app/api/patients/[id]/tests/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const { searchParams } = new URL(request.url);
    const archived = searchParams.get('archived'); // 'true' or 'false'

    const whereClause: any = {
      patient_id: patientId,
      is_deleted: false,
    };

    if (archived === 'false') {
      whereClause.is_printed = false;
    } else if (archived === 'true') {
      whereClause.is_printed = true;
    }
    // If archived is not specified, return all tests

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
    console.error('Error fetching patient tests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tests' },
      { status: 500 }
    );
  }
}