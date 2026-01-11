import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCasaTemplates() {
  try {
    console.log('🌱 Starting CASA Templates Seeding...');

    // 1. Ensure Andrology Category exists
    const andrologyCategory = await prisma.testCategory.upsert({
      where: { name: 'Andrology' },
      update: {},
      create: {
        name: 'Andrology',
        description: 'Male fertility and semen analysis tests',
        is_active: true,
      },
    });

    // 2. Delete existing CASA template to prevent duplicates (Optional, safer to just upsert)
    // For clean seed, we delete the specific code
    await prisma.testTemplate.deleteMany({
      where: { code: 'CASA' }
    });

    // 3. Create the CASA Template
    const casaTemplate = await prisma.testTemplate.create({
      data: {
        name: 'Computer-Assisted Semen Analysis (CASA)',
        code: 'CASA',
        category_id: andrologyCategory.id,
        description: 'Comprehensive semen analysis using computer-assisted sperm analysis system with WHO 2021 criteria',
        specimen: 'Semen',
        container: 'Sterile wide-mouth container',
        volume: '2-5 mL',
        storage: 'Room temperature, analyze within 1 hour',
        methodology: 'WHO 2021 guidelines, CASA system',
        turnaround_time: 'Same day',
        fees: 150.00,
        is_active: true,
        andrology_test_type: 'CASA',
      },
    });

    // 4. Define Parameters
    // These codes MUST match the mapping in app/api/generate-pdf/route.ts
    const parameters = [
      // --- BASIC PARAMETERS ---
      {
        name: 'Volume',
        code: 'VOLUME',
        units: 'mL',
        normal_range_min: 1.5,
        normal_range_max: 5.0,
        normal_range_text: '≥1.5 mL',
        is_critical: false,
        sort_order: 1,
      },
      {
        name: 'Appearance',
        code: 'APPEARANCE',
        units: '',
        normal_range_min: null,
        normal_range_max: null,
        normal_range_text: 'Normal, Opalescent',
        is_critical: false,
        sort_order: 2,
      },
      {
        name: 'pH',
        code: 'PH',
        units: '',
        normal_range_min: 7.2,
        normal_range_max: 8.0,
        normal_range_text: '7.2 - 8.0',
        is_critical: true,
        sort_order: 3,
      },
      {
        name: 'Liquefaction Time',
        code: 'LIQUEFACTION_TIME',
        units: 'min',
        normal_range_min: null,
        normal_range_max: 60,
        normal_range_text: '≤60 min',
        is_critical: false,
        sort_order: 4,
      },

      // --- CONCENTRATION ---
      {
        name: 'Concentration',
        code: 'CONCENTRATION',
        units: 'million/mL',
        normal_range_min: 16,
        normal_range_max: null,
        normal_range_text: '≥16 (WHO 2021)',
        is_critical: true,
        sort_order: 5,
      },
      {
        name: 'Total Sperm Count',
        code: 'TOTAL_SPERM_COUNT',
        units: 'million',
        normal_range_min: 39,
        normal_range_max: null,
        normal_range_text: '≥39',
        is_critical: true,
        sort_order: 6,
      },

      // --- MOTILITY ---
      {
        name: 'Total Motility',
        code: 'TOTAL_MOTILITY',
        units: '%',
        normal_range_min: 42,
        normal_range_max: 100,
        normal_range_text: '≥42% (PR + NP)',
        is_critical: true,
        sort_order: 7,
      },
      {
        name: 'Progressive Motility',
        code: 'PROGRESSIVE_MOTILITY',
        units: '%',
        normal_range_min: 30,
        normal_range_max: 100,
        normal_range_text: '≥30% (PR)',
        is_critical: true,
        sort_order: 8,
      },
      {
        name: 'Non-Progressive Motility',
        code: 'NON_PROGRESSIVE',
        units: '%',
        normal_range_min: null,
        normal_range_max: null,
        normal_range_text: 'See Report',
        is_critical: false,
        sort_order: 9,
      },
      {
        name: 'Immotile Sperm',
        code: 'IMMOTILE',
        units: '%',
        normal_range_min: null,
        normal_range_max: 58,
        normal_range_text: '≤58%',
        is_critical: false,
        sort_order: 10,
      },

      // --- GRADES (Detailed) ---
      {
        name: 'Grade A (Rapid Progressive)',
        code: 'GRADE_A',
        units: '%',
        normal_range_min: null,
        normal_range_max: null,
        normal_range_text: '≥25% (Ideal)',
        is_critical: false,
        sort_order: 11,
      },
      {
        name: 'Grade B (Slow Progressive)',
        code: 'GRADE_B',
        units: '%',
        normal_range_min: null,
        normal_range_max: null,
        normal_range_text: 'See Report',
        is_critical: false,
        sort_order: 12,
      },

      // --- MORPHOLOGY ---
      {
        name: 'Normal Morphology',
        code: 'NORMAL_MORPHOLOGY',
        units: '%',
        normal_range_min: 4,
        normal_range_max: 100,
        normal_range_text: '≥4% (Strict Kruger)',
        is_critical: true,
        sort_order: 13,
      },
      {
        name: 'Abnormal Morphology',
        code: 'ABNORMAL_MORPHOLOGY',
        units: '%',
        normal_range_min: null,
        normal_range_max: 96,
        normal_range_text: '<96%',
        is_critical: false,
        sort_order: 14,
      },
      {
        name: 'Head Defects',
        code: 'HEAD_DEFECTS',
        units: '%',
        normal_range_min: null,
        normal_range_max: null,
        normal_range_text: 'See Report',
        is_critical: false,
        sort_order: 15,
      },
      {
        name: 'Midpiece Defects',
        code: 'MIDPIECE_DEFECTS',
        units: '%',
        normal_range_min: null,
        normal_range_max: null,
        normal_range_text: 'See Report',
        is_critical: false,
        sort_order: 16,
      },
      {
        name: 'Tail Defects',
        code: 'TAIL_DEFECTS',
        units: '%',
        normal_range_min: null,
        normal_range_max: null,
        normal_range_text: 'See Report',
        is_critical: false,
        sort_order: 17,
      },
      {
        name: 'Teratozoospermia Index',
        code: 'TERATOZOOSPERMIA_INDEX',
        units: '',
        normal_range_min: null,
        normal_range_max: 1.6,
        normal_range_text: '≤1.6',
        is_critical: false,
        sort_order: 18,
      },

      // --- VITALITY ---
      {
        name: 'Vitality (Live Sperm)',
        code: 'VITALITY',
        units: '%',
        normal_range_min: 54,
        normal_range_max: 100,
        normal_range_text: '≥54%',
        is_critical: true,
        sort_order: 19,
      },

      // --- KINETICS (CASA Specific) ---
      {
        name: 'VCL (Curvilinear Velocity)',
        code: 'VCL',
        units: 'µm/s',
        normal_range_min: 25,
        normal_range_max: null,
        normal_range_text: '≥25 µm/s',
        is_critical: false,
        sort_order: 20,
      },
      {
        name: 'VSL (Straight-Line Velocity)',
        code: 'VSL',
        units: 'µm/s',
        normal_range_min: 20,
        normal_range_max: null,
        normal_range_text: '≥20 µm/s',
        is_critical: false,
        sort_order: 21,
      },
      {
        name: 'LIN (Linearity)',
        code: 'LIN',
        units: '%',
        normal_range_min: 50,
        normal_range_max: null,
        normal_range_text: '≥50%',
        is_critical: false,
        sort_order: 22,
      },
      {
        name: 'ALH (Lat. Head Displacement)',
        code: 'ALH',
        units: 'µm',
        normal_range_min: 2.5,
        normal_range_max: 7.0,
        normal_range_text: '2.5 - 7.0 µm',
        is_critical: false,
        sort_order: 23,
      },
      {
        name: 'BCF (Beat Cross Freq)',
        code: 'BCF',
        units: 'Hz',
        normal_range_min: 10,
        normal_range_max: 16,
        normal_range_text: '10 - 16 Hz',
        is_critical: false,
        sort_order: 24,
      },

      // --- INTERPRETATION ---
      {
        name: 'WHO Classification',
        code: 'WHO_CLASSIFICATION',
        units: '',
        normal_range_min: null,
        normal_range_max: null,
        normal_range_text: 'Normozoospermia',
        is_critical: false,
        sort_order: 25,
      },
      {
        name: 'Clinical Interpretation',
        code: 'CLINICAL_INTERPRETATION',
        units: '',
        normal_range_min: null,
        normal_range_max: null,
        normal_range_text: 'See Report',
        is_critical: false,
        sort_order: 26,
      }
    ];

    // 5. Create Parameters in Batch
    await prisma.testParameter.createMany({
      data: parameters.map(param => ({
        test_template_id: casaTemplate.id,
        ...param
      })),
      skipDuplicates: true, // Prisma feature to handle unique constraint issues if run multiple times
    });

    console.log('✅ CASA Template seeded successfully with', parameters.length, 'parameters.');
  } catch (error) {
    console.error('❌ Error seeding CASA templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedCasaTemplates()
  .catch(console.error);