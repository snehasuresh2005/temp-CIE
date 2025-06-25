import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/locations/availability - Check location availability
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const date = searchParams.get('date');

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      );
    }

    // Check if location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    if (!location.is_available) {
      return NextResponse.json({
        available: false,
        reason: 'Location is not available for booking',
      });
    }

    // If specific time range is provided, check for conflicts
    if (startTime && endTime) {
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);

      const conflictingBooking = await prisma.locationBooking.findFirst({
        where: {
          location_id: locationId,
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
        return NextResponse.json({
          available: false,
          reason: 'Location is already booked for this time slot',
          conflictingBooking: {
            start_time: conflictingBooking.start_time,
            end_time: conflictingBooking.end_time,
            title: conflictingBooking.title,
          },
        });
      }

      return NextResponse.json({
        available: true,
        location: {
          id: location.id,
          name: location.name,
          building: location.building,
          floor: location.floor,
          room_number: location.room_number,
          capacity: location.capacity,
        },
      });
    }

    // If date is provided, return all bookings for that date
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const bookings = await prisma.locationBooking.findMany({
        where: {
          location_id: locationId,
          OR: [
            {
              start_time: {
                gte: startOfDay,
                lte: endOfDay,
              },
            },
            {
              end_time: {
                gte: startOfDay,
                lte: endOfDay,
              },
            },
            {
              AND: [
                { start_time: { lte: startOfDay } },
                { end_time: { gte: endOfDay } },
              ],
            },
          ],
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
      });

      return NextResponse.json({
        available: true,
        location: {
          id: location.id,
          name: location.name,
          building: location.building,
          floor: location.floor,
          room_number: location.room_number,
          capacity: location.capacity,
        },
        bookings,
      });
    }

    // Return general availability
    return NextResponse.json({
      available: true,
      location: {
        id: location.id,
        name: location.name,
        building: location.building,
        floor: location.floor,
        room_number: location.room_number,
        capacity: location.capacity,
      },
    });
  } catch (error) {
    console.error('Error checking location availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 