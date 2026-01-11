// app/api/translations/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const locale = searchParams.get('locale') || 'en'

  try {
    const translations = await prisma.translation.findMany({
      where: {
        language_code: locale,
      },
      select: {
        key: true,
        value: true,
        namespace: true,
      },
    })

    // Convert to simple key-value object
    const translationObj = translations.reduce((acc, item) => {
      acc[item.key] = item.value
      return acc
    }, {} as Record<string, string>)

    return Response.json(translationObj)
  } catch (error) {
    console.error('Translation fetch error:', error)
    return Response.json({}, { status: 500 })
  }
}