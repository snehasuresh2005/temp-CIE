import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserById } from '@/lib/auth';

// GET /api/locations - Get all locations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const locationType = searchParams.get('type') || '';

    const skip = (page - 1) * limit;

    const whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { building: { contains: search, mode: 'insensitive' } },
        { room_number: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (locationType) {
      whereClause.location_type = locationType;
    }

    const [locations, total] = await Promise.all([
      prisma.location.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { created_date: 'desc' },
      }),
      prisma.location.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      locations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/locations - Create a new location (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Get user from header
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const user = await getUserById(userId);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied - Admin only" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      building,
      floor,
      wing,
      room_number,
      location_type,
      images,
      capacity,
      description,
    } = body;

    // Validation
    if (!name || !building || !floor || !room_number || !location_type || !capacity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (capacity <= 0) {
      return NextResponse.json(
        { error: 'Capacity must be greater than 0' },
        { status: 400 }
      );
    }

    const location = await prisma.location.create({
      data: {
        name,
        building,
        floor,
        wing,
        room_number,
        location_type,
        images: images || [],
        capacity,
        description,
        created_by: userId,
        modified_by: userId,
      },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 