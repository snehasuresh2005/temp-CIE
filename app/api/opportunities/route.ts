import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserById } from '@/lib/auth';

// Extract user from x-user-id header
async function getUserFromRequest(req: NextRequest) {
  const userId = req.headers.get('x-user-id');
  if (!userId) return null;
  return await getUserById(userId);
}

// GET: List all opportunities
export async function GET(req: NextRequest) {
  const opportunities = await prisma.opportunity.findMany({
    include: {
      faculty: { include: { user: true } },
      applications: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(opportunities);
}

// POST: Create a new opportunity (admin only)
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const data = await req.json();
  try {
    const opportunity = await prisma.opportunity.create({
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
        status: data.status || 'OPEN',
      },
    });
    // Fetch with faculty user info for UI
    const fullOpportunity = await prisma.opportunity.findUnique({
      where: { id: opportunity.id },
      include: { faculty: { include: { user: true } }, applications: true },
    });
    return NextResponse.json(fullOpportunity);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
} 