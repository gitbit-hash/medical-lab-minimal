// app/api/tests/[id]/assign-external/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { localPrisma } from '@/app/lib/db/local-client';
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: testId } = await context.params;
        const data = await request.json();

        // Verify lab exists
        const lab = await localPrisma.externalLab.findUnique({
            where: { id: data.external_lab_id }
        });

        if (!lab) {
            return NextResponse.json(
                { error: 'External lab not found' },
                { status: 404 }
            );
        }

        // Update test with external lab assignment
        const updatedTest = await localPrisma.test.update({
            where: { id: testId },
            data: {
                external_lab_id: data.external_lab_id,
                outsourcing_cost: data.outsourcing_cost
            },
            include: {
                patient: true,
                doctor: true,
                test_template: {
                    include: {
                        category: true,
                        parameters: true,
                    },
                },
                external_lab: true,
            }
        });

        return NextResponse.json({
            success: true,
            data: updatedTest
        });
    } catch (error) {
        console.error('Failed to assign test to external lab:', error);
        return NextResponse.json(
            { error: 'Failed to assign test to external lab' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: testId } = await context.params;

        // First, get the current assignment to log it
        const currentTest = await localPrisma.test.findUnique({
            where: { id: testId },
            include: { external_lab: true }
        });

        // Update test to remove external lab assignment
        const updatedTest = await localPrisma.test.update({
            where: { id: testId },
            data: {
                external_lab_id: null,
                outsourcing_cost: 0
            },
            include: {
                patient: true,
                doctor: true,
                test_template: {
                    include: {
                        category: true,
                        parameters: true,
                    },
                },
                external_lab: true,
            }
        });

        return NextResponse.json({
            success: true,
            data: updatedTest
        });
    } catch (error) {
        console.error('Failed to remove external lab assignment:', error);
        return NextResponse.json(
            { error: 'Failed to remove external lab assignment' },
            { status: 500 }
        );
    }
}