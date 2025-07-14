import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserById } from '@/lib/auth';

// GET /api/locations/[id] - Get a specific location
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const location = await prisma.location.findUnique({
      where: { id: params.id },
      include: {
        bookings: {
          where: {
            start_time: {
              gte: new Date(),
            },
          },
          orderBy: { start_time: 'asc' },
          include: {
            faculty: {
              include: {
                user: {
                  select: { name: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(location);
  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/locations/[id] - Update a location (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      is_available,
    } = body;

    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: { id: params.id },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Validation
    if (capacity !== undefined && capacity <= 0) {
      return NextResponse.json(
        { error: 'Capacity must be greater than 0' },
        { status: 400 }
      );
    }

    const location = await prisma.location.update({
      where: { id: params.id },
      data: {
        name,
        building,
        floor,
        wing,
        room_number,
        location_type,
        images,
        capacity,
        description,
        is_available,
        modified_by: userId,
      },
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/locations/[id] - Delete a location (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: { id: params.id },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Delete all bookings for this location
    await prisma.locationBooking.deleteMany({
      where: { location_id: params.id },
    });

    // Delete the location
    await prisma.location.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 