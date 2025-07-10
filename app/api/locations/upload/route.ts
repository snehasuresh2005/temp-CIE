import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { getUserById } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/locations/upload - Upload location images
export async function POST(request: NextRequest) {
  try {
    // Get user from header
    const userId = request.headers.get("x-user-id");
    console.log('Received x-user-id:', userId);
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const user = await getUserById(userId);
    console.log('Fetched user:', user);
    if (!user) {
      console.log('User not found with ID:', userId);
      return NextResponse.json({ 
        error: "Invalid session - please log out and log back in", 
        code: "INVALID_SESSION" 
      }, { status: 401 });
    }
    if (user.role !== "ADMIN") {
      console.log('Access denied: role is not admin. Role received:', user.role);
      return NextResponse.json({ error: "Access denied - Admin only" }, { status: 403 });
    }

    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const locationId = formData.get('locationId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    // If locationId is provided, validate that the location exists
    if (locationId) {
      const location = await prisma.location.findUnique({
        where: { id: locationId }
      });
      
      if (!location) {
        return NextResponse.json(
          { error: 'Location not found' },
          { status: 404 }
        );
      }
    }

    const uploadedImages: string[] = [];

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Only image files are allowed' },
          { status: 400 }
        );
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File size must be less than 5MB' },
          { status: 400 }
        );
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop();
      const filename = `${timestamp}_${randomString}.${extension}`;

      // Save file to public directory
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadDir = join(process.cwd(), 'public', 'location-images');
      
      // Create directory if it doesn't exist
      try {
        await writeFile(join(uploadDir, filename), buffer);
      } catch (error) {
        // Create directory if it doesn't exist
        const { mkdir } = await import('fs/promises');
        await mkdir(uploadDir, { recursive: true });
        await writeFile(join(uploadDir, filename), buffer);
      }

      uploadedImages.push(`/location-images/${filename}`);
    }

    return NextResponse.json({
      message: 'Images uploaded successfully',
      images: uploadedImages,
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 