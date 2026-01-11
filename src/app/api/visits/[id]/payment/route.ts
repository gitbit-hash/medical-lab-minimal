// app/api/visits/[id]/payment/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from '@/app/lib/db/local-client';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: visitId } = await params;
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
      payment_method
    } = body;

    // Get the visit
    const visit = await localPrisma.patientVisit.findUnique({
      where: { id: visitId },
      include: { patient: true }
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    // Update visit payment
    const updatedVisit = await localPrisma.patientVisit.update({
      where: { id: visitId },
      data: {
        amount_paid,
        amount_due,
        payment_status,
        payment_method,
        receipt_number,
      }
    });

    // Update patient's overall payment status
    const allVisits = await localPrisma.patientVisit.findMany({
      where: { patient_id: visit.patient_id }
    });

    const totalPaid = allVisits.reduce((sum, v) => sum + (v.amount_paid || 0), 0);
    const totalDue = allVisits.reduce((sum, v) => sum + (v.amount_due || 0), 0);

    // Update patient
    await localPrisma.patient.update({
      where: { id: visit.patient_id },
      data: {
        amount_paid: totalPaid,
        amount_due: totalDue,
        payment_status: totalDue === 0 ? 'Paid' : totalPaid > 0 ? 'PartiallyPaid' : 'Unpaid'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        visit: updatedVisit,
        patient: {
          amount_paid: totalPaid,
          amount_due: totalDue
        }
      }
    });
  } catch (error) {
    console.error('Failed to update visit payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}