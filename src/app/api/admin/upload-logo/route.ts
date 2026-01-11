import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth-options';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SuperAdmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type - accept PNG
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.png') && file.type !== 'image/png') {
      return NextResponse.json(
        { success: false, error: 'Only PNG files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (2MB max for PNG)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 2MB' },
        { status: 400 }
      );
    }

    // Read the PNG content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert PNG to base64 data URL
    const base64Png = buffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Png}`;

    // Save the original file for web preview
    const uploadsDir = path.join(process.cwd(), 'public', 'logos');
    await mkdir(uploadsDir, { recursive: true });

    const uniqueId = uuidv4().slice(0, 8);
    const sanitizedName = fileName
      .replace(/[^a-zA-Z0-9.]/g, '_')
      .replace(/_+/g, '_');
    const filename = `logo_${uniqueId}_${sanitizedName}`;
    const filePath = path.join(uploadsDir, filename);

    // Save the file
    await writeFile(filePath, buffer);

    const fileUrl = `/logos/${filename}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      dataUrl, // Return base64 data URL
      filename,
      message: 'Logo uploaded successfully'
    });

  } catch (error) {
    console.error('Logo upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload logo' },
      { status: 500 }
    );
  }
}