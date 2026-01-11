import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { prisma } from '@/app/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is SuperAdmin
    if (!session?.user || session.user.role !== 'SuperAdmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const simple = searchParams.get('simple');

    // If simple=true, return only id and name for dropdowns
    if (simple === 'true') {
      const users = await prisma.user.findMany({
        where: {
          role: { in: ['Admin', 'SuperAdmin'] }
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: { name: 'asc' }
      });

      return NextResponse.json({
        success: true,
        data: users
      });
    }

    // Otherwise, return full user list (but without sensitive data)
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['Admin', 'SuperAdmin'] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        last_login_at: true,
        is_active: true,
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}