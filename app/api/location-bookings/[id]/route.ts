import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserById } from '@/lib/auth';

// GET /api/location-bookings/[id] - Get a specific booking
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const booking = await prisma.locationBooking.findUnique({
      where: { id: params.id },
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

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/location-bookings/[id] - Update a booking (Faculty who created it)
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
    if (!user || user.role !== "FACULTY") {
      return NextResponse.json({ error: "Access denied - Faculty only" }, { status: 403 });
    }

    const body = await request.json();
    const {
      start_time,
      end_time,
      purpose,
      title,
      description,
    } = body;

    // Check if booking exists and belongs to the user
    const existingBooking = await prisma.locationBooking.findUnique({
      where: { id: params.id },
      include: {
        faculty: true,
      },
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (existingBooking.faculty.user_id !== userId) {
      return NextResponse.json(
        { error: 'Access denied - You can only update your own bookings' },
        { status: 403 }
      );
    }

    // Validation
    if (start_time && end_time) {
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

      // Check for conflicting bookings (excluding current booking)
      const conflictingBooking = await prisma.locationBooking.findFirst({
        where: {
          location_id: existingBooking.location_id,
          id: { not: params.id },
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
    }

    const booking = await prisma.locationBooking.update({
      where: { id: params.id },
      data: {
        start_time: start_time ? new Date(start_time) : undefined,
        end_time: end_time ? new Date(end_time) : undefined,
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

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/location-bookings/[id] - Delete a booking (Faculty who created it)
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
    if (!user || user.role !== "FACULTY") {
      return NextResponse.json({ error: "Access denied - Faculty only" }, { status: 403 });
    }

    // Check if booking exists and belongs to the user
    const existingBooking = await prisma.locationBooking.findUnique({
      where: { id: params.id },
      include: {
        faculty: true,
      },
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (existingBooking.faculty.user_id !== userId) {
      return NextResponse.json(
        { error: 'Access denied - You can only delete your own bookings' },
        { status: 403 }
      );
    }

    // Check if booking is in the past
    if (existingBooking.start_time < new Date()) {
      return NextResponse.json(
        { error: 'Cannot delete past bookings' },
        { status: 400 }
      );
    }

    await prisma.locationBooking.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 