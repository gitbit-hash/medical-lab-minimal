// app/api/tests/[id]/images/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { localPrisma } from '@/app/lib/db/local-client';

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params

  try {
    const testId = id;
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const caption = formData.get('caption') as string;
    const imageType = formData.get('imageType') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'casa', testId);
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = path.extname(file.name);
    const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save to database
    const testImage = await localPrisma.testImage.create({
      data: {
        test_id: testId,
        file_name: file.name,
        file_path: `/uploads/casa/${testId}/${fileName}`,
        file_size: file.size,
        mime_type: file.type,
        caption: caption || null,
        image_type: imageType as any,
        uploaded_by: 'system-user-id' // Replace with actual user ID from session
      }
    });

    return NextResponse.json({
      success: true,
      image: testImage
    });

  } catch (error) {
    console.error('Image upload failed:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

// Get all images for a test
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params
  try {
    const testId = id;
    const images = await localPrisma.testImage.findMany({
      where: { test_id: testId },
      orderBy: { uploaded_at: 'desc' }
    });

    return NextResponse.json({ images });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

// Delete an image
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const url = new URL(request.url);
    const imageId = url.pathname.split('/').pop(); // Get image ID from URL

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
    const url = new URL(request.url);
    const imageId = url.pathname.split('/').pop();

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { caption } = body;

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