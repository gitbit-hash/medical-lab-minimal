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

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        const data = await request.json();

        // Validate required fields
        if (!data.name || data.name.trim() === '') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Lab name is required'
                },
                { status: 400 }
            );
        }

        const lab = await localPrisma.externalLab.create({
            data: {
                name: data.name.trim(),
                contact_number: data.contact_number?.trim() || null,
                address: data.address?.trim() || null,
                email: data.email?.trim() || null
            }
        });

        return NextResponse.json({
            success: true,
            data: lab
        });
    } catch (error) {
        console.error('Failed to create external lab:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to create external lab'
            },
            { status: 500 }
        );
    }
}