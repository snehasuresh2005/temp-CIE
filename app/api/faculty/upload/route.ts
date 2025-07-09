import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const facultyId = formData.get('facultyId') as string;

  if (!file || !facultyId) {
    return NextResponse.json({ error: 'Missing file or facultyId' }, { status: 400 });
  }

  // Get faculty record to get the facultyId (faculty_id field)
  const faculty = await prisma.faculty.findUnique({
    where: { id: facultyId }
  });

  if (!faculty) {
    return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
  }

  // Get original file extension and ensure it's a supported image format
  const originalExtension = path.extname(file.name).toLowerCase();
  let fileExtension = originalExtension;
  
  // Support common image formats
  if (!['.jpg', '.jpeg', '.png'].includes(fileExtension)) {
    fileExtension = '.jpg'; // Default to jpg if unsupported format
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Use the faculty's faculty_id as filename
  const actualFacultyId = faculty.faculty_id;
  const fileName = `${actualFacultyId}${fileExtension}`;
  const filePath = path.join(process.cwd(), 'public', 'profile-img', fileName);

  // Remove any existing images for this faculty (different extensions)
  const extensions = ['.jpg', '.jpeg', '.png'];
  for (const ext of extensions) {
    const existingFile = path.join(process.cwd(), 'public', 'profile-img', `${actualFacultyId}${ext}`);
    try {
      await fs.unlink(existingFile);
    } catch (error) {
      // File doesn't exist, that's fine
    }
  }

  // Save the new image
  await fs.writeFile(filePath, buffer);

  return NextResponse.json({ 
    success: true, 
    fileName,
    facultyId: actualFacultyId,
    message: `Profile image saved as ${fileName}`
  });
}