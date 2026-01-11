// app/api/whatsapp-country-code/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function GET() {
  try {
    // Public endpoint - no auth required
    const setting = await prisma.reportSettings.findUnique({
      where: { key: 'whatsapp.countryCode' },
    });

    const countryCode = setting?.value || '';

    return NextResponse.json({
      success: true,
      countryCode: typeof countryCode === 'string' ? countryCode : String(countryCode),
    });
  } catch (error) {
    console.error('Failed to fetch WhatsApp country code:', error);
    return NextResponse.json(
      { success: false, countryCode: '', error: 'Failed to fetch country code' },
      { status: 500 }
    );
  }
}

