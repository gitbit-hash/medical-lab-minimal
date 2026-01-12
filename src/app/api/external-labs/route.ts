// app/api/external-labs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from '@/app/lib/db/local-client';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const labs = await localPrisma.externalLab.findMany({
            where: {
                is_deleted: false // Only fetch non-deleted labs
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json({
            success: true,
            data: labs
        });
    } catch (error) {
        console.error('Failed to fetch external labs:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch external labs',
                data: []
            },
            { status: 500 }
        );
    }
}