import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { prisma } from '@/app/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SuperAdmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const action = searchParams.get('action');
    const entity_type = searchParams.get('entity_type');
    const user_id = searchParams.get('user_id');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const discount_actions = searchParams.get('discount_actions');

    const skip = (page - 1) * limit;

    // Build the where clause for Prisma
    let where: any = {};

    // Action filter - FIXED: Use partial matching
    if (action) {
      where.action = {
        contains: action,
        mode: 'insensitive'
      };
    }

    // Entity type filter
    if (entity_type) {
      where.entity_type = entity_type;
    }

    // User filter
    if (user_id) {
      where.user_id = user_id;
    }

    // Date range filter
    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) {
        where.created_at.gte = new Date(date_from);
      }
      if (date_to) {
        where.created_at.lte = new Date(date_to + 'T23:59:59.999Z');
      }
    }

    // Discount actions filter
    if (discount_actions === 'discount_only') {
      where.OR = [
        { action: { contains: 'DISCOUNT', mode: 'insensitive' } },
        { action: { contains: 'APPLY_DISCOUNT', mode: 'insensitive' } },
        { action: { contains: 'UPDATE_DISCOUNT', mode: 'insensitive' } },
        { description: { contains: 'discount', mode: 'insensitive' } }
      ];
    } else if (discount_actions === 'no_discount') {
      where.NOT = {
        OR: [
          { action: { contains: 'DISCOUNT', mode: 'insensitive' } },
          { action: { contains: 'APPLY_DISCOUNT', mode: 'insensitive' } },
          { action: { contains: 'UPDATE_DISCOUNT', mode: 'insensitive' } },
          { description: { contains: 'discount', mode: 'insensitive' } }
        ]
      };
    }

    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Serialize the logs to convert Dates to strings
    const serializedLogs = logs.map(log => ({
      ...log,
      created_at: log.created_at.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: serializedLogs,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: totalPages
      }
    });

  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}