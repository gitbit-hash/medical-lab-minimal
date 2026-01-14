import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from '@/app/lib/db/local-client';
import { syncPatientFinancials } from '@/app/lib/utils/financial-sync';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      amount_paid,
      amount_due,
      payment_status,
      receipt_number,
      payment_method = 'Cash',
      // Optional: track if this is part of visit creation
      skipDuplicateAuditCheck = false
    } = body;

    // 1. Get the patient's current payment info BEFORE updating
    const currentPatient = await localPrisma.patient.findUnique({
      where: { id },
      select: {
        amount_paid: true,
        amount_due: true,
        name: true
      }
    });

    if (!currentPatient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // 2. Calculate the new payment amount (transaction amount)
    const previousAmountPaid = currentPatient.amount_paid || 0;
    const paymentReceived = amount_paid - previousAmountPaid; // This is the NEW payment
    const transactionAmount = Math.max(0, paymentReceived);
    const isAdditionalPayment = paymentReceived > 0;
    const isRefund = paymentReceived < 0;

    // 3. Check if this payment might be part of a visit creation
    // Skip this check if explicitly told to (for edge cases)
    let isVisitPayment = false;
    if (!skipDuplicateAuditCheck) {
      // Look for recent visits (last 10 minutes) that have the same payment amount
      const recentVisits = await localPrisma.patientVisit.findMany({
        where: {
          patient_id: id,
          created_at: {
            gte: new Date(Date.now() - 600000) // Last 10 minutes
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: 5
      });

      // Check if any recent visit has the same payment amount as this transaction
      for (const visit of recentVisits) {
        // If this payment amount matches a recent visit's payment, it's likely part of visit creation
        if (Math.abs(visit.amount_paid! - transactionAmount) < 0.01) { // Compare with tolerance
          isVisitPayment = true;
          break;
        }
      }
    }

    // Start a transaction to ensure consistency
    const result = await localPrisma.$transaction(async (prisma) => {
      // 1. Update patient payment
      const updatedPatient = await prisma.patient.update({
        where: { id },
        data: {
          amount_paid,
          amount_due,
          payment_status,
          payment_method,
          receipt_number,
          receipt_printed: true,
          receipt_printed_at: new Date(),
          receipt_printed_by: session.user.id,
          sync_status: 'Pending',
        },
      });

      // 2. If payment is for full amount, update all unpaid visits
      if (payment_status === 'Paid' || amount_due === 0) {
        // Find all visits for this patient that have unpaid balances
        const visits = await prisma.patientVisit.findMany({
          where: {
            patient_id: id,
            OR: [
              { amount_due: { gt: 0 } },
              { payment_status: { not: 'Paid' } }
            ]
          }
        });

        // Update each visit to mark as paid
        for (const visit of visits) {
          await prisma.patientVisit.update({
            where: { id: visit.id },
            data: {
              amount_paid: (visit.amount_paid || 0) + (visit.amount_due || 0),
              amount_due: 0,
              payment_status: 'Paid',
              payment_method: payment_method,
              receipt_number: receipt_number,
            }
          });
        }
      }

      return updatedPatient;
    });

    // 4. Sync financials to ensure consistency
    await syncPatientFinancials(id);

    // 6. If partial payment, record it
    if (payment_status === 'PartiallyPaid') {
      const existingPartial = await localPrisma.patient.findUnique({
        where: { id },
        select: { partial_payments: true }
      });

      const partialPayments = existingPartial?.partial_payments || [];
      const newPartial = Array.isArray(partialPayments) ? partialPayments : [];

      newPartial.push({
        date: new Date().toISOString(),
        amount: amount_paid,
        by_user: session.user.name,
        receipt_number,
      });

      await localPrisma.patient.update({
        where: { id },
        data: {
          partial_payments: newPartial,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
      isVisitPayment, // Optional: include for debugging
    });
  } catch (error) {
    console.error('Failed to update payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const patient = await localPrisma.patient.findUnique({
      where: { id },
      select: {
        amount_paid: true,
        amount_due: true,
        payment_status: true,
        partial_payments: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error('Failed to fetch payment info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment info' },
      { status: 500 }
    );
  }
}