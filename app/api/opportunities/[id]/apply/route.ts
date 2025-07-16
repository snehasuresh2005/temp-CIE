import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserById } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const user = await getUserById(userId);
  if (!user || user.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  // Fetch the Student record for this user
  const student = await prisma.student.findUnique({ where: { user_id: userId } });
  if (!student) {
    return NextResponse.json({ error: 'Student profile not found.' }, { status: 404 });
  }
  const studentId = student.id;
  const opportunityId = params.id;
  try {
    const formData = await req.formData();
    const resume = formData.get('resume');
    if (!resume || typeof resume === 'string' || resume.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Please upload a PDF resume.' }, { status: 400 });
    }
    const buffer = Buffer.from(await resume.arrayBuffer());
    const resumeName = resume.name;
    // Write the resume file to public/resumes
    const resumesDir = path.join(process.cwd(), 'public', 'resumes');
    await mkdir(resumesDir, { recursive: true });
    const filePath = path.join(resumesDir, resumeName);
    await writeFile(filePath, buffer);
    // Check if already applied
    const existing = await prisma.opportunityApplication.findFirst({
      where: { opportunityId, studentId },
    });
    if (existing) {
      return NextResponse.json({ error: 'Already applied to this opportunity.' }, { status: 400 });
    }
    const application = await prisma.opportunityApplication.create({
      data: {
        opportunityId,
        studentId,
        resumeData: buffer,
        resumeName,
        resumePath: `resumes/${resumeName}`,
        status: 'PENDING',
      },
    });
    return NextResponse.json(application);
  } catch (error) {
    console.error(error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
} 