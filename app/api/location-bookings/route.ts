import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserById } from '@/lib/auth';

// GET /api/location-bookings - Get all bookings with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const facultyId = searchParams.get('facultyId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = request.headers.get("x-user-id");

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (locationId) {
      whereClause.location_id = locationId;
    }

    if (facultyId) {
      if (facultyId === 'current' && userId) {
        // Get faculty ID for current user
        const faculty = await prisma.faculty.findFirst({
          where: { user_id: userId },
        });
        if (faculty) {
          whereClause.faculty_id = faculty.id;
        } else {
          return NextResponse.json(
            { error: 'Faculty profile not found' },
            { status: 404 }
          );
        }
      } else {
        whereClause.faculty_id = facultyId;
      }
    }

    if (startDate && endDate) {
      whereClause.OR = [
        {
          start_time: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          end_time: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        {
          AND: [
            { start_time: { lte: new Date(startDate) } },
            { end_time: { gte: new Date(endDate) } },
          ],
        },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.locationBooking.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { start_time: 'asc' },
        include: {
          location: true,
          faculty: {
            include: {
              user: {
                select: { name: true, email: true },
              },
            },
          },
        },
      }),
      prisma.locationBooking.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching location bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/location-bookings - Create a new booking (Faculty only)
export async function POST(request: NextRequest) {
  try {
    // Get user from header
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const user = await getUserById(userId);
    if (!user || user.role !== "FACULTY") {
      return NextResponse.json({ error: "Access denied - Faculty only" }, { status: 403 });
    }

    const body = await request.json();
    const {
      location_id,
      start_time,
      end_time,
      purpose,
      title,
      description,
    } = body;

    // Validation
    if (!location_id || !start_time || !end_time || !purpose || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    if (startDate < new Date()) {
      return NextResponse.json(
        { error: 'Cannot book locations in the past' },
        { status: 400 }
      );
    }

    // Check if location exists and is available
    const location = await prisma.location.findUnique({
      where: { id: location_id },
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    if (!location.is_available) {
      return NextResponse.json(
        { error: 'Location is not available for booking' },
        { status: 400 }
      );
    }

    // Check for conflicting bookings
    const conflictingBooking = await prisma.locationBooking.findFirst({
      where: {
        location_id,
        OR: [
          {
            AND: [
              { start_time: { lte: startDate } },
              { end_time: { gt: startDate } },
            ],
          },
          {
            AND: [
              { start_time: { lt: endDate } },
              { end_time: { gte: endDate } },
            ],
          },
          {
            AND: [
              { start_time: { gte: startDate } },
              { end_time: { lte: endDate } },
            ],
          },
        ],
      },
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { error: 'Location is already booked for this time slot' },
        { status: 409 }
      );
    }

    // Get faculty ID
    const faculty = await prisma.faculty.findFirst({
      where: { user_id: userId },
    });

    if (!faculty) {
      return NextResponse.json(
        { error: 'Faculty profile not found' },
        { status: 404 }
      );
    }

    const booking = await prisma.locationBooking.create({
      data: {
        location_id,
        faculty_id: faculty.id,
        start_time: startDate,
        end_time: endDate,
        purpose,
        title,
        description,
      },
      include: {
        location: true,
        faculty: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating location booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 