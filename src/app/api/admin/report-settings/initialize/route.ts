// app/api/admin/report-settings/initialize/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { prisma } from '@/app/lib/prisma';

const defaultSettings = [
  { key: 'header.enabled', value: true, description: 'Enable/disable PDF header' },
  { key: 'header.labName', value: 'LAB MEDICAL DIAGNOSTIC LABORATORY', description: 'Laboratory name for header' },
  { key: 'header.specialization1', value: 'Medical Laboratory Specialist', description: 'Laboratory Laboratory Specialist' },
  { key: 'header.specialization2', value: 'Medical Laboratory Specialist', description: 'Laboratory Laboratory Specialist' },
  { key: 'header.specialization3', value: 'Medical Laboratory Specialist', description: 'Laboratory Laboratory Specialist' },
  { key: 'header.preservedSpace', value: '100px', description: 'Height for pre-printed header space' },
  { key: 'footer.enabled', value: true, description: 'Enable/disable PDF footer' },
  { key: 'footer.directorName', value: 'Dr. Laboratory Director', description: 'Laboratory director name' },
  { key: 'footer.directorTitle', value: 'Medical Laboratory Scientist', description: 'Laboratory director title' },
  { key: 'footer.labHours', value: 'Mon–Fri: 7AM–6PM\nSat: 8AM–2PM', description: 'Laboratory operating hours' },
  { key: 'footer.emergencyNumber', value: '(555) 123-EMER', description: 'Emergency contact number' },
  { key: 'footer.contactLab', value: '(555) 123-4567', description: 'General laboratory contact' },
  { key: 'footer.preservedSpace', value: '120px', description: 'Height for pre-printed footer space' },
  { key: 'esign.enabled', value: false, description: 'Enable/disable e-signature in footer' },
  { key: 'esign.imageUrl', value: '/signatures/director-signature.png', description: 'URL/path to signature image file' },
  { key: 'esign.width', value: '120px', description: 'Width of the signature image' },
  { key: 'esign.height', value: '40px', description: 'Height of the signature image' },
  { key: 'logo.enabled', value: false, description: 'Enable/disable logo in header' },
  { key: 'logo.pngUrl', value: '/logos/lab-logo.png', description: 'URL/path to logo PNG file' },
  { key: 'logo.width', value: '50px', description: 'Width of the logo' },
  { key: 'logo.height', value: '50px', description: 'Height of the logo' },
  { key: 'logo.align', value: 'left', description: 'Alignment of the logo' },
];

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SuperAdmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await Promise.all(
      defaultSettings.map(async (setting) => {
        return await prisma.reportSettings.upsert({
          where: { key: setting.key },
          update: {},
          create: {
            key: setting.key,
            value: setting.value,
            description: setting.description,
            updated_by: session.user.id,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Settings initialized successfully',
      data: results,
    });
  } catch (error) {
    console.error('Failed to initialize settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize settings' },
      { status: 500 }
    );
  }
}