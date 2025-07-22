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
  try {
    const opportunities = await prisma.opportunity.findMany({
      include: {
        facultyInCharge: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        opportunityApplications: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    // Map facultyInCharge to faculty for frontend compatibility
    const mapped = (opportunities || []).map(o => ({
      ...o,
      faculty: o.facultyInCharge ? { user: { name: o.facultyInCharge.name, email: o.facultyInCharge.email } } : undefined,
    }));
    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a new opportunity (admin only)
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const data = await req.json();
  try {
    let facultyInChargeId = data.facultyInChargeId;
    const cuidRegex = /^c[a-z0-9]{24}$/i;
    let facultyUser = null;

    if (!cuidRegex.test(facultyInChargeId)) {
      // Try to resolve as Faculty id
      const facultyRecord = await prisma.faculty.findUnique({ where: { id: facultyInChargeId } });
      if (facultyRecord) {
        facultyInChargeId = facultyRecord.user_id;
      }
    }

    if (!cuidRegex.test(facultyInChargeId)) {
      // Lookup by name or email
      facultyUser = await prisma.user.findFirst({
        where: {
          role: 'FACULTY',
          OR: [
            { name: facultyInChargeId },
            { email: facultyInChargeId },
          ],
        },
      });
    } else {
      // Lookup by id and ensure role is FACULTY
      facultyUser = await prisma.user.findFirst({
        where: {
          id: facultyInChargeId,
          role: 'FACULTY',
        },
      });
    }

    if (!facultyUser) {
      return NextResponse.json({ error: 'Faculty user not found for facultyInChargeId' }, { status: 400 });
    }
    const userIdToUse = facultyUser.id;

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
        facultyInChargeId: userIdToUse,
        capacity: data.capacity,
        status: data.status || 'OPEN',
      },
    });
    console.log('Calling findUnique on Opportunity with:', { where: { id: opportunity.id }, include: { facultyInCharge: true, opportunityApplications: true } });
    // Fetch with facultyInCharge user info for UI
    const fullOpportunity = await prisma.opportunity.findUnique({
      where: { id: opportunity.id },
      include: {
        facultyInCharge: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        opportunityApplications: true,
      },
    });
    const mappedOpportunity = fullOpportunity
      ? {
          ...fullOpportunity,
          faculty: fullOpportunity.facultyInCharge
            ? { user: { name: fullOpportunity.facultyInCharge.name, email: fullOpportunity.facultyInCharge.email } }
            : undefined,
        }
      : null;
    return NextResponse.json(mappedOpportunity);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
} 