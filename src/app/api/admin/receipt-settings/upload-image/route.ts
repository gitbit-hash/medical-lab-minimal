// app/api/admin/receipt-settings/upload-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { prisma } from '../../../../lib/prisma';

export const runtime = 'nodejs';

// Allowed image types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SuperAdmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;
    const imageType = formData.get('type') as string || 'qr-code';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 2MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${imageType}-${timestamp}.${extension}`;

    // Define upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'receipt-images');

    // In a real app, you'd want to use a proper file system check
    // For now, we'll create the directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save file to disk
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Generate public URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const imageUrl = `${baseUrl}/uploads/receipt-images/${filename}`;

    // Determine which key to save to based on image type
    const key = imageType === 'lab-logo'
      ? 'receipt.lab.logoUrl'
      : 'receipt.qrCode.qrImageUrl';

    const description = imageType === 'lab-logo'
      ? 'Laboratory logo image URL'
      : 'Custom QR code image URL';

    // Save image URL to database settings
    await prisma.reportSettings.upsert({
      where: { key },
      update: {
        value: imageUrl,
        updated_by: session.user.id,
        updated_at: new Date(),
      },
      create: {
        key,
        value: imageUrl,
        description,
        updated_by: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: imageUrl,
        filename: filename,
        size: file.size,
      }
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SuperAdmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('imageUrl');
    const imageType = searchParams.get('type') || 'qr-code'; // Get the type

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 });
    }

    // Extract filename from URL
    const filename = imageUrl.split('/').pop();
    if (!filename) {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
    }

    // Delete file from disk
    const filePath = join(process.cwd(), 'public', 'uploads', 'receipt-images', filename);
    const fs = require('fs');

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Determine which key to update based on image type
    const key = imageType === 'lab-logo'
      ? 'receipt.lab.logoUrl'
      : 'receipt.qrCode.qrImageUrl';

    // Remove from database - set to empty string instead of deleting
    await prisma.reportSettings.update({
      where: { key },
      data: { value: '' },
    });

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}