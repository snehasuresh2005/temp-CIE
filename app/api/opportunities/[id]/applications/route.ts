import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserById } from '@/lib/auth';

// Extract user from x-user-id header
async function getUserFromRequest(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return null;
  return await getUserById(userId);
}

// GET: List all applications for an opportunity
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { id: opportunityId } = params;
  // Only faculty assigned to this opportunity or admin can view
  // user.profileData.id is Faculty.id, user.id is User.id
  const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opportunity) return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
  const facultyId = user.role === 'FACULTY' ? user.profileData?.id : null;
  if (!(user.role === 'ADMIN' || (user.role === 'FACULTY' && facultyId === opportunity.facultyId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  try {
    const applications = await prisma.opportunityApplication.findMany({
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
    // Map resumePath and resumeName to resume_path and resume_id for frontend compatibility
    const appsWithResume = applications.map(app => ({
      ...app,
      student: {
        ...app.student,
        resume_path: app.resumePath ? app.resumePath.replace(/^Resume\//, 'resumes/').replace(/^resume\//, 'resumes/') : undefined,
        resume_id: app.resumeName,
      },
    }));
    return NextResponse.json(appsWithResume);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errMsg }, { status: 400 });
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
  const facultyIdPatch = user.role === 'FACULTY' ? user.profileData?.id : null;
  if (!(user.role === 'ADMIN' || (user.role === 'FACULTY' && facultyIdPatch === opportunity.facultyId))) {
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
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errMsg }, { status: 400 });
  }
} 