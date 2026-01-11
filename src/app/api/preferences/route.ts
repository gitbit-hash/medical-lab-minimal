// app/api/admin/preferences/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/app/lib/prisma";

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { language } = await request.json();

    // Validate language
    const validLanguages = ['en', 'ar', 'fr', 'es'];
    if (!validLanguages.includes(language)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }

    // Update user's preferred language
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        preferred_language: language,
        // Also update the language relation
        language: {
          connect: { code: language }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Language preference updated'
    });
  } catch (error) {
    console.error('Failed to update user preferences:', error);
    return NextResponse.json({
      error: 'Failed to update preferences'
    }, { status: 500 });
  }
}