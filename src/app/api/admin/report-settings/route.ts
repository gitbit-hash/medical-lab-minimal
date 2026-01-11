// app/api/admin/report-settings/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { prisma } from '../../../lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SuperAdmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.reportSettings.findMany();
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({ success: true, data: settingsMap });
  } catch (error) {
    console.error('Failed to fetch report settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// app/api/admin/report-settings/route.ts
// Update the POST handler
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SuperAdmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid settings data' },
        { status: 400 }
      );
    }

    const updates = Object.entries(settings).map(([key, value]) => {
      // Prisma's Json type can handle most JavaScript values
      // Just ensure it's a valid JSON-serializable value
      const jsonValue = value as Prisma.InputJsonValue;

      return prisma.reportSettings.upsert({
        where: { key },
        update: {
          value: jsonValue,
          updated_by: session.user.id,
          updated_at: new Date()
        },
        create: {
          key,
          value: jsonValue,
          description: getSettingDescription(key),
          updated_by: session.user.id,
        },
      });
    });

    await Promise.all(updates);

    // Fetch and return all settings to verify
    const allSettings = await prisma.reportSettings.findMany();
    const settingsMap = allSettings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: settingsMap
    });
  } catch (error) {
    console.error('Failed to update report settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

function getSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    'header.enabled': 'Enable/disable PDF header',
    'header.labName': 'Laboratory name for header',
    'header.specialization1': 'Laboratory Specialist',
    'header.specialization2': 'Laboratory Specialist',
    'header.specialization3': 'Laboratory Specialist',
    'header.preservedSpace': 'Height for pre-printed header space',
    'footer.enabled': 'Enable/disable PDF footer',
    'footer.directorName': 'Laboratory director name',
    'footer.directorTitle': 'Laboratory director title',
    'footer.labHours': 'Laboratory operating hours',
    'footer.emergencyNumber': 'Emergency contact number',
    'footer.contactLab': 'General laboratory contact',
    'footer.preservedSpace': 'Height for pre-printed footer space',
    'esign.enabled': 'Enable/disable e-signature in footer',
    'esign.imageUrl': 'URL/path to signature image file',
    'esign.width': 'Width of the signature image',
    'esign.height': 'Height of the signature image',
    'whatsapp.countryCode': 'Country code for WhatsApp phone numbers (without +)',
  };
  return descriptions[key] || 'Report setting';
}