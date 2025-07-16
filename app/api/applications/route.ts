import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserById } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const user = await getUserById(userId);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const data = await request.json();
  const { internshipId, resumeUrl } = data;
  if (!internshipId || !resumeUrl) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  try {
    const application = await prisma.application.create({
      data: {
        internshipId,
        studentId: userId,
        resumeUrl,
      },
    });
    return NextResponse.json({ application });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to apply', details: error }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const user = await getUserById(userId);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  try {
    const applications = await prisma.application.findMany({
      where: { studentId: userId },
      select: { internshipId: true, status: true },
    });
    return NextResponse.json({ applications });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch applications', details: error }, { status: 500 });
  }
} 