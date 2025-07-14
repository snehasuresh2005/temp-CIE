import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// Placeholder for extracting user from request
async function getUserFromRequest(req) {
  // TODO: Implement actual extraction from session/cookie/token
  return null;
}

// GET: List all applications for an opportunity
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { id: opportunityId } = params;
  // Only faculty assigned to this opportunity or admin can view
  const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opportunity) return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
  if (!(user.role === 'ADMIN' || (user.role === 'FACULTY' && user.id === opportunity.facultyId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  try {
    const applications = await prisma.opportunityApplication.findMany({
      where: { opportunityId },
      include: { student: { select: { name: true, email: true, resume_id: true, resume_path: true } } },
      orderBy: { appliedAt: 'desc' },
    });
    return NextResponse.json(applications);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PATCH: Update application status (faculty/admin only)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { id: opportunityId } = params;
  // Only faculty assigned to this opportunity or admin can patch
  const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opportunity) return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
  if (!(user.role === 'ADMIN' || (user.role === 'FACULTY' && user.id === opportunity.facultyId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const data = await req.json();
  // data: { applicationId, status }
  if (!data.applicationId || !data.status) {
    return NextResponse.json({ error: 'Missing applicationId or status' }, { status: 400 });
  }
  try {
    const updated = await prisma.opportunityApplication.update({
      where: { id: data.applicationId },
      data: { status: data.status },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
} 