import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserById } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { applicationId: string } }) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const user = await getUserById(userId);
  if (!user || user.role?.toLowerCase() !== 'faculty') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const { applicationId } = params;
  const { status } = await req.json();
  // Find the application and opportunity
  const application = await prisma.opportunityApplication.findUnique({
    where: { id: applicationId },
    include: { opportunity: true },
  });
  if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  const facultyInChargeId = application.opportunity?.facultyInChargeId;
  if (facultyInChargeId !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  // Update status
  const updated = await prisma.opportunityApplication.update({
    where: { id: applicationId },
    data: { status },
  });
  return NextResponse.json(updated);
} 