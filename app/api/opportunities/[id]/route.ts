import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserById } from '@/lib/auth';
// Extract user from x-user-id header
async function getUserFromRequest(req) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return null;
  return await getUserById(userId);
}

// GET: Get a single opportunity by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: { faculty: true, applications: true },
    });
    if (!opportunity) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(opportunity);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PUT: Update an opportunity (admin only)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const { id } = params;
  const data = await req.json();
  try {
    const updated = await prisma.opportunity.update({
      where: { id },
      data: {
        title: data.title,
        type: data.type,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        applicationStartDate: new Date(data.applicationStartDate),
        applicationEndDate: new Date(data.applicationEndDate),
        remuneration: data.remuneration,
        filePath: data.filePath || null,
        facultyId: data.facultyId,
        capacity: data.capacity,
        status: data.status,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE: Delete an opportunity (admin only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const { id } = params;
  try {
    await prisma.opportunity.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
} 