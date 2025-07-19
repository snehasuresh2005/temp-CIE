import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserById } from '@/lib/auth';
// Extract user from x-user-id header
async function getUserFromRequest(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return null;
  return await getUserById(userId);
}

// GET: List all opportunityApplications for the current student
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    console.error('Not authenticated: no user found');
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (user.role !== 'STUDENT') {
    console.error('Unauthorized: user is not a student', user);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  // Look up the student record by user.id
  const student = await prisma.student.findUnique({ where: { user_id: user.id } });
  if (!student) {
    console.error('Student profile not found for user', user);
    return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
  }
  try {
    const opportunityApplications = await prisma.opportunityApplication.findMany({
      where: { studentId: student.id },
      include: { opportunity: true },
      orderBy: { appliedAt: 'desc' },
    });
    return NextResponse.json(opportunityApplications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
} 