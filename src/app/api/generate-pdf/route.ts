// app/api/generate-pdf/route.ts
import { renderToStream } from '@react-pdf/renderer';
import { MultiTestReportPDF } from '../../components/MultiTestReportPDF';
import { localPrisma } from '@/app/lib/db/local-client';
import { NextResponse } from 'next/server';
import path from 'path';
import { generateCBCCharts } from '@/app/lib/utils/cbc-chart-generator';

export const runtime = 'nodejs';

async function getReportSettings() {
  try {
    const settings = await localPrisma.reportSettings.findMany();

    const settingsMap = settings.reduce((acc, setting) => {
      // Convert string 'true'/'false' to boolean for enabled fields
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

// Helper function to fetch visit-specific doctors
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

async function generatePdfStream(patient: any, tests: any, settings: any): Promise<NodeJS.ReadableStream> {
  if (!patient) throw new Error('Patient data missing');
  if (!tests?.length) throw new Error('No tests found');

  try {
    // Generate CBC Charts if applicable
    let cbcResults: any = {};
    const cbcTest = tests.find((t: any) => {
      const cat = t.test_template?.category?.name || t.test_type || '';
      return cat.toLowerCase().includes('cbc') || cat.toLowerCase().includes('complete blood count');
    });

    let cbcCharts = null;
    if (cbcTest) {
      // Extract parameters
      const results = cbcTest.results || {};
      // Helper to find value by partial key match (case insensitive)
      const findVal = (keyPart: string) => {
        const key = Object.keys(results).find(k => k.toLowerCase().includes(keyPart));
        return key ? parseFloat(results[key]) : undefined;
      };

      const cbcData = {
        wbc: findVal('wbc') || findVal('white_count'),
        lymphocytes: findVal('lymph') || findVal('lymphocytes'),
        monocytes: findVal('mono') || findVal('monocytes'),
        granulocytes: (findVal('neut') || 0) + (findVal('baso') || 0) + (findVal('eos') || 0),
        rbc: findVal('rbc') || findVal('red_count'),
        mcv: findVal('mcv'),
        rdw: findVal('rdw'),
        plt: findVal('plt') || findVal('platelet'),
        mpv: findVal('mpv')
      };

      try {
        cbcCharts = await generateCBCCharts(cbcData);
      } catch (e) {
        console.error("Failed to generate CBC histograms:", e);
      }
    }

    // Create the PDF component with the data
    const pdfElement = await MultiTestReportPDF({ patient, tests, settings, cbcCharts });

    // Render to stream
    const stream = await renderToStream(pdfElement);
    return stream;
  } catch (error) {
    console.error('PDF rendering error:', error);
    throw new Error(`Failed to render PDF: ${error}`);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('id');
    const testIdsParam = searchParams.get('testIds');

    if (!patientId || !testIdsParam)
      return new Response('Missing required parameters', { status: 400 });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const testIds = testIdsParam.split(',');

    // 🧠 Try to fetch from main API first
    let patientData: any = null;
    let testsData: any[] = [];

    try {
      const [patientRes, ...testPromises] = await Promise.all([
        fetch(`${baseUrl}/api/patients/${patientId}`),
        ...testIds.map(id => fetch(`${baseUrl}/api/tests/${id}`)),
      ]);

      if (patientRes.ok) {
        const patientJson = await patientRes.json();
        patientData = patientJson.data;
      }

      if (patientData.payment_status !== 'Paid' && patientData.amount_due > 0) {
        return new NextResponse('Payment required to generate PDF', { status: 402 }); // 402 Payment Required
      }

      const testResponses = await Promise.all(testPromises);
      const testsJson = await Promise.all(testResponses.map(async r => (r.ok ? await r.json() : null)));
      testsData = testsJson.filter(Boolean).map(j => j.data);
    } catch {
      console.warn('⚠️ Falling back to local Prisma...');
    }

    // 🧩 Fallback: if any data missing, pull directly from local Prisma
    if (!patientData) {
      patientData = await localPrisma.patient.findUnique({
        where: { id: patientId },
        // REMOVE patient's global doctors - we'll get visit-specific doctors instead
      });
    }

    if (testsData.length < testIds.length) {
      const missingIds = testIds.filter(id => !testsData.find(t => t.id === id));

      // MODIFIED: Fetch tests with their visit and visit doctors
      const localTests = await localPrisma.test.findMany({
        where: { id: { in: missingIds } },
        include: {
          patient: true,
          // REMOVE: doctor: true (global doctor)
          patient_visit: {
            include: {
              visit_doctors: {
                include: {
                  doctor: true
                }
              }
            }
          },
          test_template: {
            include: {
              category: true,
              parameters: true,
            },
          },
        },
      });

      testsData.push(...localTests);
    }

    if (!patientData) {
      return new Response('Patient not found locally or remotely', { status: 404 });
    }

    if (!testsData.length) {
      return new Response('No tests found locally or remotely', { status: 404 });
    }

    // 🧩 MODIFIED: Get visit doctors for the first test (assuming all tests are from same visit)
    // If tests are from different visits, we'll use the first test's visit doctors
    const firstTest = testsData[0];
    let visitDoctors: any[] = [];
    if (firstTest.visit_number === 1) {
      // Get doctors from the visit
      visitDoctors = patientData.doctors.map((vd: any) => vd.doctor);
    } else if (firstTest.visit_id) {
      // Fetch visit doctors if not already loaded
      visitDoctors = await getVisitDoctors(firstTest.visit_id);
    }

    // Add visit doctors to patientData
    patientData.doctors = visitDoctors;

    // 🧩 Ensure every test has a usable template/category
    const enrichedTests = testsData.map((test) => {
      if (test.test_template) return test;

      const now = new Date();
      return {
        ...test,
        test_template: {
          id: test.test_template_id || `synthetic-${test.id}`,
          name: test.test_type || 'Untitled Test',
          code: test.test_code || test.test_type || 'N/A',
          description: test.description || null,
          category: {
            id: 'synthetic-category',
            name: test.test_type || 'General Tests',
            description: 'Tests added manually via Edit Patient',
            parent_id: null,
            created_at: now,
            updated_at: now,
            is_active: true,
          },
          specimen: test.specimen || null,
          container: test.container || null,
          volume: test.volume || null,
          storage: null,
          methodology: null,
          turnaround_time: null,
          fees: 0,
          is_active: true,
          created_at: now,
          updated_at: now,
          expired_at: null,
          parameters: Object.keys(test.results || {}).map((key) => ({
            id: key,
            name: key,
            code: key,
            units: test.units,
            normal_range_text: test.normal_range,
            created_at: test.created_at,
            updated_at: test.updated_at,
          })),
        },
      };
    });

    // 🎯 Get report settings from database
    const settings = await getReportSettings();

    // Test if image exists
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

    // 🧾 Generate PDF with settings
    const pdfStream = await generatePdfStream(patientData, enrichedTests, settings);

    return new Response(pdfStream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': "inline; filename=zx.pdf",
      },
    });
  } catch (err: any) {
    console.error('💥 PDF generation failed:', err);
    return new Response(`Internal Server Error: ${err.message}`, { status: 500 });
  }
}