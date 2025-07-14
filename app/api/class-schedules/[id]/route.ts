import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // For now, we'll allow access without authentication
    // In a real app, you'd implement proper session checking here

    const schedule = await prisma.classSchedule.findUnique({
      where: { id: params.id },
      include: {
        course: true,
        faculty: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 })
    }

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error("Get class schedule error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()

    const schedule = await prisma.classSchedule.update({
      where: { id: params.id },
      data: {
        course_id: data.courseId,
        faculty_id: data.facultyId,
        room: data.room,
        day_of_week: data.dayOfWeek,
        start_time: data.startTime,
        end_time: data.endTime,
        section: data.section,
      },
      include: {
        course: true,
        faculty: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    // Transform the response to match frontend interface
    const transformedSchedule = {
      id: schedule.id,
      courseId: schedule.course_id,
      facultyId: schedule.faculty_id,
      room: schedule.room,
      dayOfWeek: schedule.day_of_week,
      startTime: schedule.start_time,
      endTime: schedule.end_time,
      section: schedule.section,
      course: {
        course_id: schedule.course.id,
        course_name: schedule.course.course_name,
      },
      faculty: {
        user: {
          name: schedule.faculty?.user.name || "",
          email: schedule.faculty?.user.email || "",
        },
      },
    };

    return NextResponse.json({ schedule: transformedSchedule })
  } catch (error) {
    console.error("Update class schedule error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // For now, we'll allow access without authentication
    // In a real app, you'd implement proper session checking here

    await prisma.classSchedule.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete class schedule error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
