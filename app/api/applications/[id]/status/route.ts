import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserById } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const user = await getUserById(userId);
  if (!user || user.role !== 'faculty') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const applicationId = params.id;
  const data = await request.json();
  const { status } = data;
  if (!['ACCEPTED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { internship: true },
  });
  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }
  if (application.internship.facultyId !== userId) {
    return NextResponse.json({ error: 'Not your internship' }, { status: 403 });
  }
  try {
    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
    });
    return NextResponse.json({ application: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update status', details: error }, { status: 500 });
  }
} 