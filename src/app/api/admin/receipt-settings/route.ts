// app/api/admin/receipt-settings/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { prisma } from '../../../lib/prisma';

// Define the receipt settings interface
export interface ReceiptSettings {
  'qrCode.enabled': boolean;
  'qrCode.instapayId': string;
  'qrCode.accountName': string;
  'qrCode.bankName': string;
  'qrCode.qrImageUrl': string;
  'qrCode.note': string;
  'qrCode.showOnPaidReceipts': boolean;
  'qrCode.position': 'right';
}
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SuperAdmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.reportSettings.findMany({
      where: {
        key: {
          startsWith: 'receipt.'
        }
      }
    });

    const settingsRecord: Record<string, any> = {};

    settings.forEach(setting => {
      const key = setting.key.replace('receipt.', '');

      if (setting.value === null || setting.value === undefined) {
        return;
      }

      if (key.includes('.enabled') || key.includes('.showOnPaidReceipts')) {
        settingsRecord[key] = Boolean(setting.value);
      } else if (key === 'qrCode.position') {
        const allowedPositions = ['right', 'top', 'bottom', 'left'];
        settingsRecord[key] = allowedPositions.includes(String(setting.value))
          ? setting.value
          : 'right';
      } else {
        settingsRecord[key] = String(setting.value);
      }
    });

    // Create the final settings object with defaults
    const defaultSettings = {
      'qrCode.enabled': false,
      'qrCode.instapayId': '',
      'qrCode.accountName': '',
      'qrCode.bankName': '',
      'qrCode.qrImageUrl': '',
      'qrCode.note': 'Scan to pay via Instapay',
      'qrCode.showOnPaidReceipts': false,
      'qrCode.position': 'right' as const,
      'lab.name': '',
      'lab.address': '',
      'lab.phone': '',
      'lab.email': '',
      'lab.logoUrl': '',
    };

    const finalSettings = { ...defaultSettings, ...settingsRecord };

    return NextResponse.json({
      success: true,
      data: finalSettings
    });
  } catch (error) {
    console.error('Failed to fetch receipt settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch receipt settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SuperAdmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const { settings } = body;

    // Validate and prepare settings for storage
    const updates = Object.entries(settings).map(([key, value]) => {
      // Ensure we have valid values (not undefined)
      let safeValue = value;

      if (value === undefined) {
        // Convert undefined to appropriate defaults
        if (key.includes('.enabled') || key.includes('.showOnPaidReceipts')) {
          safeValue = false;
        } else if (key === 'qrCode.position') {
          safeValue = 'right';
        } else {
          safeValue = '';
        }
      }

      return prisma.reportSettings.upsert({
        where: { key: `receipt.${key}` },
        update: {
          value: safeValue as any,
          updated_by: session.user.id,
          updated_at: new Date()
        },
        create: {
          key: `receipt.${key}`,
          value: safeValue as any,
          description: getReceiptSettingDescription(key),
          updated_by: session.user.id,
        },
      });
    });

    await Promise.all(updates);

    const savedSettings = await prisma.reportSettings.findMany({
      where: {
        key: {
          startsWith: 'receipt.'
        }
      },
    });

    const transformedSettings: Record<string, any> = {};
    savedSettings.forEach(setting => {
      const key = setting.key.replace('receipt.', '');

      if (setting.value === null || setting.value === undefined) {
        return;
      }

      if (key.includes('.enabled') || key.includes('.showOnPaidReceipts')) {
        transformedSettings[key] = Boolean(setting.value);
      } else if (key === 'qrCode.position') {
        const allowedPositions = ['right', 'top', 'bottom', 'left'];
        transformedSettings[key] = allowedPositions.includes(String(setting.value))
          ? setting.value
          : 'right';
      } else {
        transformedSettings[key] = String(setting.value);
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Receipt settings updated successfully',
      data: transformedSettings // Return the saved data
    });

  } catch (error) {
    console.error('Failed to update receipt settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update receipt settings' },
      { status: 500 }
    );
  }
}

function getReceiptSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    'qrCode.enabled': 'Enable/disable QR code for Instapay payments on receipts',
    'qrCode.instapayId': 'Instapay ID/account number for QR code generation',
    'qrCode.accountName': 'Account holder name for Instapay',
    'qrCode.bankName': 'Bank name associated with Instapay',
    'qrCode.qrImageUrl': 'Custom QR code image URL (optional)',
    'qrCode.note': 'Instructions or note to display with QR code',
    'qrCode.showOnPaidReceipts': 'Show QR code even when receipt is fully paid',
    'qrCode.position': 'Position of QR code on receipt (top, bottom, right, left)',
    'lab.name': 'Laboratory name to display on receipts',
    'lab.address': 'Laboratory address to display on receipts',
    'lab.phone': 'Laboratory phone number to display on receipts',
    'lab.email': 'Laboratory email to display on receipts',
    'lab.logoUrl': 'Laboratory logo image URL for receipts',
    'lab.displayMode': 'Display mode for lab information: "logo" (show only logo) or "text" (show lab details as text)',
  };
  return descriptions[key] || 'Receipt setting';
}