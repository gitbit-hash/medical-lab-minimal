// app/api/tests/[id]/casa-analysis/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { localPrisma } from '@/app/lib/db/local-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';

interface RouteParams {
  params: Promise<{ id: string }>
}
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const casaAnalysis = await localPrisma.casaAnalysis.findUnique({
      where: { test_id: id },
      include: {
        test: {
          include: {
            patient: true,
          },
        },
      },
    });

    if (!casaAnalysis) {
      return NextResponse.json({
        success: false,
        message: 'CASA analysis not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: casaAnalysis,
    });
  } catch (error) {
    console.error('Failed to fetch CASA analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CASA analysis' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check if test exists and is CASA type
    const test = await localPrisma.test.findUnique({
      where: { id },
      include: { test_template: true },
    });

    if (!test) {
      return NextResponse.json(
        { success: false, error: 'Test not found' },
        { status: 404 }
      );
    }

    let collectionDate: Date | undefined;
    if (body.collection_date) {
      collectionDate = new Date(body.collection_date);
      if (isNaN(collectionDate.getTime())) {
        // Try parsing as just date string
        collectionDate = new Date(body.collection_date + 'T00:00:00.000Z');
      }
    } else {
      collectionDate = new Date();
    }

    // Prepare data for Prisma with proper field names
    const casaData = {
      collection_date: collectionDate,
      abstinence_days: body.abstinence_days || 3,
      volume_ml: body.volume_ml || 0,
      appearance: body.appearance || 'Normal',
      ph: body.ph || 7.8,
      concentration_million_per_ml: body.concentration_million_per_ml || 0,
      total_motility_percent: body.total_motility_percent || 0,
      progressive_motility_percent: body.progressive_motility_percent || 0,
      normal_forms_percent: body.normal_forms_percent || 0,
      live_percent: body.live_percent || 0,
      who_classification: body.who_classification || 'Pending',
      clinical_interpretation: body.clinical_interpretation || '',
      technician_name: body.technician_name || '',
      counting_chamber: body.counting_chamber || 'Makler',
      dilution_factor: body.dilution_factor || 1,
      chamber_depth_mm: body.chamber_depth_mm || 0.01,
      updated_at: new Date(),
    };

    // Update or create CASA analysis
    const casaAnalysis = await localPrisma.casaAnalysis.upsert({
      where: { test_id: id },
      update: casaData,
      create: {
        test_id: id,
        ...casaData,
        created_at: new Date(),
      },
    });

    // Update test status to completed
    await localPrisma.test.update({
      where: { id },
      data: {
        status: 'Completed',
        tested_at: new Date(),
        completed_at: new Date(),
        andrology_test_type: 'CASA',
      },
    });

    return NextResponse.json({
      success: true,
      data: casaAnalysis,
      message: 'CASA analysis saved successfully',
    });
  } catch (error) {
    console.error('Failed to save CASA analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save CASA analysis: ' + (error as Error).message },
      { status: 500 }
    );
  }
}