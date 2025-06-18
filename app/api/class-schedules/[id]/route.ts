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
    // For now, we'll allow access without authentication
    // In a real app, you'd implement proper session checking here
    
    const data = await request.json()

    const schedule = await prisma.classSchedule.update({
      where: { id: params.id },
      data: {
        courseId: data.courseId,
        facultyId: data.facultyId,
        room: data.room,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        section: data.section,
      },
      include: {
        course: true,
        faculty: {
          include: {
            user: true,
          },
        },
      },
    })

    return NextResponse.json({ schedule })
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
