// app/api/generate-casa-pdf/route.ts
import { renderToStream } from '@react-pdf/renderer';
import { CasaReportPDF } from '../../components/casa/CasaReportPDF';
import { localPrisma } from '@/app/lib/db/local-client';
import { NextResponse } from 'next/server';
import path from 'path';
import { ComprehensiveCASAProcessor } from '@/app/lib/casa/comprehensive-calculations';
import { generateCasaChartsServer } from '../../lib/utils/chart-generator-server';

export const runtime = 'nodejs';

async function getReportSettings() {
  try {
    const settings = await localPrisma.reportSettings.findMany();

    const settingsMap = settings.reduce((acc, setting) => {
      let value = setting.value;
      if (setting.key.endsWith('.enabled')) {
        value = value === 'true' || value === true;
      }
      acc[setting.key] = value;
      return acc;
    }, {} as Record<string, any>);

    return settingsMap;
  } catch (error) {
    console.error('Failed to fetch report settings:', error);
    return {};
  }
}

async function getVisitDoctors(visitId: string) {
  try {
    const visitWithDoctors = await localPrisma.patientVisit.findUnique({
      where: { id: visitId },
      include: {
        visit_doctors: {
          include: {
            doctor: true
          }
        }
      }
    });

    return visitWithDoctors?.visit_doctors.map(vd => vd.doctor) || [];
  } catch (error) {
    console.error('Failed to fetch visit doctors:', error);
    return [];
  }
}

async function getTestImages(testId: string): Promise<any[]> {
  try {
    const images = await localPrisma.testImage.findMany({
      where: { test_id: testId },
    });
    return images || [];
  } catch (error) {
    console.error('Failed to fetch test images:', error);
    return [];
  }
}

async function generateCasaPdfStream(
  patient: any,
  test: any,
  casaData: any,
  settings: any
): Promise<NodeJS.ReadableStream> {
  if (!patient) throw new Error('Patient data missing');
  if (!test) throw new Error('CASA test data missing');

  try {
    // Create the PDF component with the data
    const pdfElement = CasaReportPDF({
      patient,
      test,
      settings,
      casaData
    });

    // Render to stream
    const stream = await renderToStream(pdfElement);
    return stream;
  } catch (error) {
    console.error('CASA PDF rendering error:', error);
    throw new Error(`Failed to render CASA PDF: ${error}`);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const testId = searchParams.get('testId');

    if (!testId) {
      return new NextResponse('Missing testId parameter', { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Try to fetch from main API first
    let testData: any = null;
    let patientData: any = null;

    try {
      // Fetch test data
      const testRes = await fetch(`${baseUrl}/api/tests/${testId}`);
      if (testRes.ok) {
        const testJson = await testRes.json();
        testData = testJson.data;

        // Fetch patient data
        if (testData.patient_id) {
          const patientRes = await fetch(`${baseUrl}/api/patients/${testData.patient_id}`);
          if (patientRes.ok) {
            const patientJson = await patientRes.json();
            patientData = patientJson.data;
          }
        }
      }
    } catch (apiError) {
      console.warn('⚠️ API fetch failed, falling back to local Prisma...', apiError);
    }

    // Fallback to local Prisma
    if (!testData || !patientData) {

      // Fetch test with all related data
      testData = await localPrisma.test.findUnique({
        where: { id: testId },
        include: {
          patient: true,
          patient_visit: {
            include: {
              visit_doctors: {
                include: {
                  doctor: true
                }
              }
            }
          },
          casa_analysis: true, // Include CASA analysis if exists
        },
      });

      if (!testData) {
        return new NextResponse('Test not found', { status: 404 });
      }

      patientData = testData.patient;
    }

    // Check payment status (optional)
    if (patientData.payment_status !== 'Paid' && patientData.amount_due > 0) {
      console.warn('⚠️ Payment not completed, but generating report anyway...');
    }

    // Get visit doctors
    let visitDoctors: any[] = [];
    if (testData.visit_number === 1 && patientData.doctors) {
      // Global doctors for first visit
      visitDoctors = patientData.doctors;
    } else if (testData.patient_visit?.visit_doctors) {
      // Visit-specific doctors
      visitDoctors = testData.patient_visit.visit_doctors.map((vd: any) => vd.doctor);
    }

    // Add doctors to patientData
    patientData.doctors = visitDoctors;

    // Prepare CASA data
    let casaData = testData.casa_analysis || {};

    // If no casa_analysis exists but we have results in test.results, use that
    if (!testData.casa_analysis && testData.results?.casa_inputs) {

      try {
        // Extract inputs from saved results
        const casaInputs = testData.results.casa_inputs;

        // Prepare input for CASA processor
        const processorInput = {
          ...casaInputs.basicData,
          ...casaInputs.concentrationData,
          ...casaInputs.motilityData,
          ...casaInputs.morphologyData,
          ...casaInputs.vitalityData,
          ...casaInputs.kineticData,
          ...casaInputs.biochemicalData,
          // Required fields
          leukocytesCounted: 0,
          roundCellsCounted: 0,
          marIgGBound: 0,
          marIgATotal: 0,
          collection_date: new Date(casaInputs.basicData.collection_date || new Date())
        };

        // Calculate comprehensive results
        casaData = ComprehensiveCASAProcessor.calculateComprehensiveResults(processorInput);

      } catch (calcError) {
        console.error('❌ Failed to calculate CASA data:', calcError);
        // Use empty/default data
        casaData = {};
      }
    }

    const testImages = await getTestImages(testId);

    // Add images to casaData or create a separate prop
    casaData.testImages = testImages;

    // 🎨 Generate professional charts for the PDF
    let chartImages: Record<string, string> = {};
    try {
      chartImages = await generateCasaChartsServer(casaData);
    } catch (chartError) {
      console.error('❌ Failed to generate charts:', chartError);
      // Continue without charts
    }

    // Add charts to casaData
    casaData.chartImages = chartImages;

    // Get report settings
    const settings = await getReportSettings();

    // Test if e-signature image exists
    if (settings['esign.enabled'] && settings['esign.imageUrl']) {
      const imageUrl = settings['esign.imageUrl'];
      if (imageUrl.startsWith('/')) {
        const fs = require('fs');
        const imagePath = path.join(process.cwd(), 'public', imageUrl.substring(1));
        const imageExists = fs.existsSync(imagePath);

        if (!imageExists) {
          console.warn(`⚠️ E-signature image not found at: ${imagePath}`);
        }
      }
    }

    // Generate PDF
    const pdfStream = await generateCasaPdfStream(patientData, testData, casaData, settings);

    // Create filename
    const patientName = patientData.name?.replace(/\s+/g, '_') || 'patient';
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `CASA_Report_${patientData.id}_${timestamp}.pdf`;

    return new Response(pdfStream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });

  } catch (err: any) {
    console.error('💥 CASA PDF generation failed:', err);
    return new NextResponse(`Internal Server Error: ${err.message}`, { status: 500 });
  }
}