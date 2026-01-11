// app/api/tests/images/[imageId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import { localPrisma } from '@/app/lib/db/local-client';

interface RouteParams {
  params: Promise<{ imageId: string }>
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { imageId } = await params;

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
    }

    // Find the image first to get file path
    const image = await localPrisma.testImage.findUnique({
      where: { id: imageId }
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Delete from filesystem
    try {
      const filePath = path.join(process.cwd(), 'public', image.file_path);
      await unlink(filePath);
    } catch (fsError) {
      console.error('Failed to delete file:', fsError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await localPrisma.testImage.delete({
      where: { id: imageId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Image deletion failed:', error);
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 });
  }
}

// Update image caption
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { imageId } = await params;

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { caption } = body;

    if (!caption) {
      return NextResponse.json({ error: 'Caption required' }, { status: 400 });
    }

    const updatedImage = await localPrisma.testImage.update({
      where: { id: imageId },
      data: { caption }
    });

    return NextResponse.json({ success: true, image: updatedImage });
  } catch (error) {
    console.error('Image update failed:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}