// app/lib/utils/financial-sync.ts
import { localPrisma } from '../db/local-client';
import { PaymentStatus } from '@prisma/client';

/**
 * Sync financials between patient and their visits
 */
export async function syncPatientFinancials(patientId: string) {
  try {
    // Get all non-deleted visits for patient
    const visits = await localPrisma.patientVisit.findMany({
      where: {
        patient_id: patientId,
        is_deleted: false
      }
    });

    // Calculate totals from all visits
    const totalVisitsAmount = visits.reduce((sum, visit) => sum + (visit.total_amount || 0), 0);
    const totalVisitsDiscount = visits.reduce((sum, visit) => sum + (visit.discount_amount || 0), 0);
    const totalVisitsPaid = visits.reduce((sum, visit) => sum + (visit.amount_paid || 0), 0);
    const totalVisitsDue = visits.reduce((sum, visit) => sum + (visit.amount_due || 0), 0);

    // Update patient with aggregated totals
    const updatedPatient = await localPrisma.patient.update({
      where: { id: patientId },
      data: {
        total_amount: totalVisitsAmount,
        discount_amount: totalVisitsDiscount,
        amount_paid: totalVisitsPaid,
        amount_due: totalVisitsDue,
        payment_status:
          totalVisitsDue === 0 ? 'Paid' :
            totalVisitsPaid > 0 ? 'PartiallyPaid' : 'Unpaid'
      }
    });

    return {
      total_amount: totalVisitsAmount,
      discount_amount: totalVisitsDiscount,
      amount_paid: totalVisitsPaid,
      amount_due: totalVisitsDue,
      patient: updatedPatient
    };
  } catch (error) {
    console.error('Failed to sync patient financials:', error);
    throw error;
  }
}

/**
 * Update financials for a specific visit
 */
export async function updateVisitFinancials(visitId: string) {
  try {
    const visit = await localPrisma.patientVisit.findUnique({
      where: { id: visitId },
      include: {
        tests: {
          include: {
            test_template: true
          },
          where: {
            is_deleted: false,
            status: { not: 'Cancelled' }
          }
        }
      }
    });

    if (!visit) return;

    // Calculate total from tests in this visit
    const testTotal = visit.tests.reduce((sum, test) => {
      const fees = test.test_template?.fees || 0;
      return sum + fees;
    }, 0);

    // Apply visit discount
    const finalTotal = Math.max(0, testTotal - (visit.discount_amount || 0));

    // Calculate amount due (remaining balance)
    const amountDue = Math.max(0, finalTotal - (visit.amount_paid || 0));

    // Determine payment status
    let paymentStatus: PaymentStatus = 'Unpaid';
    if (amountDue === 0) {
      paymentStatus = 'Paid';
    } else if (visit.amount_paid && visit.amount_paid > 0) {
      paymentStatus = 'PartiallyPaid';
    }

    // Update visit
    const updatedVisit = await localPrisma.patientVisit.update({
      where: { id: visitId },
      data: {
        total_amount: finalTotal,
        amount_due: amountDue,
        payment_status: paymentStatus
      }
    });

    // Sync patient financials
    await syncPatientFinancials(visit.patient_id);

    return {
      testTotal,
      finalTotal,
      amountPaid: visit.amount_paid || 0,
      amountDue,
      paymentStatus
    };
  } catch (error) {
    console.error('Failed to update visit financials:', error);
    throw error;
  }
}