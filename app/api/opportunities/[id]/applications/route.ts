import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Extract user from x-user-id header
async function getUserFromRequest(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user;
}

// GET: List all opportunityApplications for an opportunity
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { id: opportunityId } = params;
  // Only faculty assigned to this opportunity can view
  console.log('Calling findUnique on Opportunity with:', { where: { id: opportunityId } });
  const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opportunity) return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
  if (!(user.role?.toLowerCase() === 'faculty' && user.id.toLowerCase() === opportunity.facultyInChargeId.toLowerCase())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  try {
    const opportunityApplications = await prisma.opportunityApplication.findMany({
      where: { opportunityId },
      include: {
        student: {
          select: {
            student_id: true,
            user: { select: { name: true, email: true } }
          }
        }
      },
      orderBy: { appliedAt: 'desc' },
    });
    // Attach resumePath and flatten student info for frontend
    const withStudentInfo = opportunityApplications.map(app => ({
      ...app,
      resumePath: app.resumePath,
      studentName: app.student?.user?.name || '',
      studentEmail: app.student?.user?.email || '',
      studentUserId: app.student?.student_id || '',
    }));
    return NextResponse.json(withStudentInfo);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errMsg }, { status: 400 });
  }
}

// PATCH: Update opportunityApplication status (faculty/admin only)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { id: opportunityId } = params;
  // Only faculty assigned to this opportunity can patch
  console.log('Calling findUnique on Opportunity with:', { where: { id: opportunityId } });
  const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opportunity) return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
  if (!(user.role?.toLowerCase() === 'faculty' && user.id.toLowerCase() === opportunity.facultyInChargeId.toLowerCase())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const data = await req.json();
  // data: { opportunityApplicationId, status }
  if (!data.opportunityApplicationId || !data.status) {
    return NextResponse.json({ error: 'Missing opportunityApplicationId or status' }, { status: 400 });
  }
  try {
    const updated = await prisma.opportunityApplication.update({
      where: { id: data.opportunityApplicationId },
      data: { status: data.status },
    });
    return NextResponse.json(updated);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errMsg }, { status: 400 });
  }
} 