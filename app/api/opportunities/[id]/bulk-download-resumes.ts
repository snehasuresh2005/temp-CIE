import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { copyFile } from 'fs/promises';
import path from 'path';
import { getUserById } from '@/lib/auth';

// Extract user from x-user-id header
async function getUserFromRequest(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return null;
  return await getUserById(userId);
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { id: opportunityId } = params;
  // Only faculty assigned to this opportunity or admin can view
  console.log('Calling findUnique on Opportunity with:', { where: { id: opportunityId } });
  const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!opportunity) return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
  if (!(user.role === 'ADMIN' || (user.role === 'FACULTY' && user.id === opportunity.facultyId))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  try {
    const applications = await prisma.opportunityApplication.findMany({
      where: { opportunityId },
      include: { student: true },
    });
    const copied: string[] = [];
    for (const app of applications) {
      const resumePath = app.resumePath;
      if (resumePath) {
        const fileName = resumePath.split('/').pop();
        const src = path.join(process.cwd(), 'private_resumes', fileName);
        const dest = path.join(process.cwd(), 'public', 'resumes', fileName);
        try {
          await copyFile(src, dest);
          copied.push(fileName);
        } catch (e) {
          // Ignore if already exists or error
        }
      }
    }
    return NextResponse.json({ success: true, copied });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
} 