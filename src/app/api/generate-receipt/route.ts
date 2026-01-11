// app/api/generate-receipt/route.ts
import { renderToStream } from '@react-pdf/renderer';
import { NextRequest, NextResponse } from 'next/server';
import { ReceiptPDF, ReceiptPDFProps } from '@/app/components/ReceiptPDF';
import { localPrisma } from '@/app/lib/db/local-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    const receiptNumber = searchParams.get('receiptNumber');
    const visitId = searchParams.get('visitId');

    if (!patientId || !receiptNumber) {
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    // Get session for user info
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Fetch receipt settings (QR code settings)
    const receiptSettingsRecords = await localPrisma.reportSettings.findMany({
      where: {
        key: {
          startsWith: 'receipt.'
        }
      },
    });

    // Define proper types for transformed settings
    interface TransformedReceiptSettings {
      qrCode: {
        enabled?: any;
        instapayId?: any;
        accountName?: any;
        bankName?: any;
        qrImageUrl?: any;
        note?: any;
        showOnPaidReceipts?: any;
        position?: any;
      };
      lab: {
        name?: any;
        address?: any;
        phone?: any;
        email?: any;
        logoUrl?: any;
        displayMode?: any;
      };
    }

    // Transform receipt settings
    const receiptSettingsObj: TransformedReceiptSettings = { qrCode: {}, lab: {} };
    receiptSettingsRecords.forEach(setting => {
      const key = setting.key.replace('receipt.', '');
      const [category, ...rest] = key.split('.');
      const subKey = rest.join('.');

      if (category === 'qrCode' || category === 'lab') {
        // Use type assertion to safely assign the value
        if (category === 'qrCode') {
          (receiptSettingsObj.qrCode as any)[subKey] = setting.value;
        } else if (category === 'lab') {
          (receiptSettingsObj.lab as any)[subKey] = setting.value;
        }
      }
    });

    // Helper function to safely get boolean values
    const getBooleanValue = (value: any): boolean => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') return value.toLowerCase() === 'true';
      return Boolean(value);
    };

    // Helper function to safely get string values
    const getStringValue = (value: any): string => {
      if (value === null || value === undefined) return '';
      return String(value);
    };

    // Helper function to safely get position value
    const getPositionValue = (value: any): 'right' | 'top' | 'bottom' | 'left' => {
      const allowedPositions = ['right', 'top', 'bottom', 'left'];
      const strValue = String(value);
      return allowedPositions.includes(strValue) ? strValue as 'right' | 'top' | 'bottom' | 'left' : 'right';
    };

    // Check if QR code should be shown
    const qrCodeEnabled = getBooleanValue(receiptSettingsObj.qrCode?.enabled);
    const showOnPaidReceipts = getBooleanValue(receiptSettingsObj.qrCode?.showOnPaidReceipts);
    const qrCodePosition = getPositionValue(receiptSettingsObj.qrCode?.position);

    let visit = null;
    let patient = null;
    let tests = [];
    let visitTotalFees = 0;
    let discountAmount = 0;
    let receiptVisit = null;
    let visitFinalTotal = 0;
    let visitAmountPaid = 0;
    let visitAmountDue = 0;
    let visitPaymentStatus = 'Unpaid';
    let visitPaymentMethod = 'Cash';

    // If visitId is provided, fetch visit-specific receipt
    if (visitId) {
      visit = await localPrisma.patientVisit.findUnique({
        where: {
          id: visitId,
          is_deleted: false
        },
        include: {
          patient: true,
          tests: {
            where: {
              is_deleted: false,
            },
            include: {
              test_template: {
                select: {
                  name: true,
                  code: true,
                  fees: true
                }
              }
            },
            orderBy: { created_at: 'asc' }
          },
        },
      });

      if (!visit) {
        return new NextResponse('Visit not found', { status: 404 });
      }

      patient = visit.patient;
      tests = visit.tests;

      // Use visit-specific financials
      visitTotalFees = tests.reduce((sum, test) => {
        const fees = test.test_template?.fees || 0;
        return sum + fees;
      }, 0);

      discountAmount = visit.discount_amount || 0;
      visitFinalTotal = Math.max(0, visitTotalFees - discountAmount);
      visitAmountPaid = visit.amount_paid || 0;
      visitAmountDue = visit.amount_due || 0;
      visitPaymentStatus = visit.payment_status || 'Unpaid';
      visitPaymentMethod = visit.payment_method || 'Cash';
    } else {
      // Fallback: Fetch patient data (for backward compatibility)
      patient = await localPrisma.patient.findUnique({
        where: {
          id: patientId,
          is_deleted: false
        },
        include: {
          doctors: {
            include: {
              doctor: true,
            },
            orderBy: { referred_at: 'desc' }
          },
        },
      });

      if (!patient) {
        return new NextResponse('Patient not found', { status: 404 });
      }

      // Get tests from the most recent visit for this receipt number
      receiptVisit = await localPrisma.patientVisit.findFirst({
        where: {
          patient_id: patientId,
          receipt_number: receiptNumber,
          is_deleted: false
        },
        orderBy: { visit_date: 'desc' },
        take: 1
      });

      if (receiptVisit) {
        // Get tests from this specific visit
        const visitWithTests = await localPrisma.patientVisit.findUnique({
          where: { id: receiptVisit.id },
          include: {
            tests: {
              where: { is_deleted: false },
              include: {
                test_template: {
                  select: {
                    name: true,
                    code: true,
                    fees: true
                  }
                }
              },
              orderBy: { created_at: 'asc' }
            },
          },
        });

        tests = visitWithTests?.tests || [];
        visitTotalFees = tests.reduce((sum, test) => {
          const fees = test.test_template?.fees || 0;
          return sum + fees;
        }, 0);

        discountAmount = receiptVisit.discount_amount || 0;
        visitFinalTotal = Math.max(0, visitTotalFees - discountAmount);
        visitAmountPaid = receiptVisit.amount_paid || 0;
        visitAmountDue = receiptVisit.amount_due || 0;
        visitPaymentStatus = receiptVisit.payment_status || 'Unpaid';
        visitPaymentMethod = receiptVisit.payment_method || 'Cash';
      } else {
        // Fallback to old logic (last 24 hours)
        tests = await localPrisma.test.findMany({
          where: {
            patient_id: patientId,
            is_deleted: false,
            created_at: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          },
          include: {
            test_template: {
              select: {
                name: true,
                code: true,
                fees: true
              }
            }
          },
          orderBy: { created_at: 'desc' }
        });

        visitTotalFees = tests.reduce((sum, test) => {
          const fees = test.test_template?.fees || 0;
          return sum + fees;
        }, 0);

        discountAmount = patient.discount_amount || 0;
        visitFinalTotal = Math.max(0, visitTotalFees - discountAmount);
        visitAmountPaid = patient.amount_paid || 0;
        visitAmountDue = patient.amount_due || 0;
        visitPaymentStatus = patient.payment_status || 'Unpaid';
        visitPaymentMethod = patient.payment_method || 'Cash';
      }
    }

    // Get user who created/printed the receipt
    const createdBy = session.user?.name || 'System';

    // Prepare discount data if exists
    const discount = discountAmount > 0 ? {
      amount: discountAmount,
      percentage: patient.discount_percentage || 0,
      type: (patient.discount_type || 'Percentage') as 'Percentage' | 'Fixed',
      reason: patient.discount_reason || undefined,
    } : null;

    // Prepare payment info
    const paymentInfo = {
      amount_paid: visitAmountPaid,
      amount_due: visitAmountDue,
      payment_status: visitPaymentStatus,
      payment_method: visitPaymentMethod,
    };

    // Format tests for PDF
    const formattedTests = tests.map(test => ({
      name: test.test_template?.name || test.test_type || 'Unknown Test',
      fees: test.test_template?.fees || 0,
      test_type: test.test_type,
      test_code: test.test_template?.code ?? test.test_code ?? undefined,
    }));

    const getDisplayModeValue = (value: any): 'logo' | 'text' => {
      if (value === null || value === undefined) return 'text';
      const strValue = String(value).toLowerCase();
      return (strValue === 'logo' || strValue === 'text') ? strValue as 'logo' | 'text' : 'text';
    };
    const labDisplayMode = getDisplayModeValue(receiptSettingsObj.lab?.displayMode);
    // Determine if we should show QR code
    const shouldShowQRCode = qrCodeEnabled && showOnPaidReceipts;

    // Fetch lab settings from database or use defaults
    const labName = getStringValue(receiptSettingsObj.lab?.name) || 'Medical Laboratory';
    const labAddress = getStringValue(receiptSettingsObj.lab?.address) || '123 Medical Street, City';
    const labPhone = getStringValue(receiptSettingsObj.lab?.phone) || '+123 456 7890';
    const labEmail = getStringValue(receiptSettingsObj.lab?.email) || 'info@lab.com';
    const labLogoUrl = getStringValue(receiptSettingsObj.lab?.logoUrl);

    // Prepare lab settings
    const labSettings = {
      name: labName,
      address: labAddress,
      phone: labPhone,
      email: labEmail,
      logoUrl: labLogoUrl || undefined,
      displayMode: labDisplayMode, // Add this
    };

    // Prepare QR code settings (if enabled)
    const qrCodeSettings = shouldShowQRCode ? {
      enabled: qrCodeEnabled,
      instapayId: getStringValue(receiptSettingsObj.qrCode?.instapayId),
      accountName: getStringValue(receiptSettingsObj.qrCode?.accountName),
      bankName: getStringValue(receiptSettingsObj.qrCode?.bankName),
      qrImageUrl: getStringValue(receiptSettingsObj.qrCode?.qrImageUrl),
      note: getStringValue(receiptSettingsObj.qrCode?.note) || 'Scan to pay via Instapay',
      showOnPaidReceipts: showOnPaidReceipts,
      position: qrCodePosition,
    } : {
      enabled: false,
      instapayId: '',
      accountName: '',
      bankName: '',
      qrImageUrl: '',
      note: 'Scan to pay via Instapay',
      showOnPaidReceipts: false,
      position: 'right' as const,
    };


    // Prepare receipt data
    const receiptData: ReceiptPDFProps = {
      labSettings,
      patient: {
        name: patient.name,
        age_value: patient.age_value,
        age_unit: patient.age_unit,
        gender: patient.gender,
        phone: patient.phone,
        address: patient.address,
      },
      tests: formattedTests,
      discount,
      totalFees: visitTotalFees,
      finalTotal: visitFinalTotal,
      createdBy,
      receiptNumber,
      paymentInfo,
      visitNumber: visit?.visit_number || receiptVisit?.visit_number,
      visitDate: visit?.visit_date || receiptVisit?.visit_date,
      receiptSettings: {
        qrCode: qrCodeSettings, // This is always defined now
        lab: labSettings,
      },
    };

    // Create PDF element
    const pdfElement = ReceiptPDF(receiptData);

    // Render to stream
    const stream = await renderToStream(pdfElement);

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename=Receipt_${receiptNumber}.pdf`,
      },
    });
  } catch (error) {
    console.error('Error generating receipt PDF:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}