import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserById } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const user = await getUserById(userId);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const data = await request.json();
  const { title, description, duration, skills, facultyId, slots, startDate, endDate } = data;
  if (!title || !description || !duration || !skills || !facultyId || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  try {
    const internship = await prisma.internshipProject.create({
      data: {
        title,
        description,
        duration,
        skills,
        facultyId,
        slots: slots ?? null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });
    return NextResponse.json({ internship });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create internship', details: error }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const internships = await prisma.internshipProject.findMany({
      include: {
        faculty: { select: { id: true, name: true } },
      },
      orderBy: { startDate: 'desc' },
    });
    // Map faculty to facultyName for frontend compatibility
    const safeInternships = internships.map(i => ({
      ...i,
      facultyName: i.faculty ? i.faculty.name : null,
    }));
    return NextResponse.json({ internships: safeInternships });
  } catch (error) {
    console.error('Error in GET /api/internships:', error);
    return NextResponse.json({ error: 'Failed to fetch internships', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 