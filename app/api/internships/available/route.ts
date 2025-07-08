import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserById } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    let internships;
    if (user.role === 'faculty') {
      internships = await prisma.internshipProject.findMany({
        where: { facultyId: userId },
        include: { faculty: true },
      });
    } else if (user.role === 'student') {
      internships = await prisma.internshipProject.findMany({
        where: { isAccepted: true },
        include: { faculty: true },
      });
    } else {
      return NextResponse.json({ error: 'Forbidden - Only faculty or students can access' }, { status: 403 });
    }
    return NextResponse.json({ internships });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch internships', details: error }, { status: 500 });
  }
} 