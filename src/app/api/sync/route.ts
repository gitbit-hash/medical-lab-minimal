// app/api/sync/route.ts
import { syncEngine } from '../../lib/sync/sync-engine';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from '../auth/auth-options';

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncEngine.sync();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      {
        error: 'Sync failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { localPrisma } = await import('../../lib/db/local-client');

    const [pendingPatients, pendingDoctors, pendingTests, totalPendingTests] =
      await localPrisma.$transaction([
        localPrisma.patient.count({
          where: { sync_status: 'Pending', is_deleted: false },
        }),
        localPrisma.doctor.count({
          where: { sync_status: 'Pending', is_deleted: false },
        }),
        localPrisma.test.count({
          where: { sync_status: 'Pending', is_deleted: false },
        }),
        localPrisma.test.count({
          where: { is_deleted: false },
        }),
      ]);

    const status = {
      pendingPatients,
      pendingDoctors,
      pendingTests,
      totalActiveTests: totalPendingTests,
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
