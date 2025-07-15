import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// Placeholder for extracting user from request
async function getUserFromRequest(req) {
  // TODO: Implement actual extraction from session/cookie/token
  return null;
}

// GET: List all applications for the current student
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (user.role !== 'STUDENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  try {
    const applications = await prisma.opportunityApplication.findMany({
      where: { studentId: user.id },
      include: { opportunity: true },
      orderBy: { appliedAt: 'desc' },
    });
    return NextResponse.json(applications);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
} 