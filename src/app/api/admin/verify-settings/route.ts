// app/api/admin/verify-settings/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SuperAdmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.reportSettings.findMany({
      where: {
        OR: [
          { key: 'esign.enabled' },
          { key: 'esign.imageUrl' },
          { key: 'esign.width' },
          { key: 'esign.height' }
        ]
      }
    });

    return NextResponse.json({
      success: true,
      settings,
      count: settings.length
    });
  } catch (error) {
    console.error('Failed to verify settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify settings' },
      { status: 500 }
    );
  }
}