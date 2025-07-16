import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserById } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const user = await getUserById(userId);
  if (!user || user.role !== 'faculty') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const internshipId = params.id;
  const internship = await prisma.internshipProject.findUnique({ where: { id: internshipId } });
  if (!internship) {
    return NextResponse.json({ error: 'Internship not found' }, { status: 404 });
  }
  if (internship.facultyId !== userId) {
    return NextResponse.json({ error: 'Not your internship' }, { status: 403 });
  }
  try {
    const applications = await prisma.application.findMany({
      where: { internshipId },
      include: { student: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json({ applications });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch applicants', details: error }, { status: 500 });
  }
} 