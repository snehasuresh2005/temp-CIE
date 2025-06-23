import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const enrollments = await prisma.enrollment.findMany({
      include: {
        course: {
          select: {
            code: true,
            name: true,
          },
        },
        student: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        enrolled_at: "desc",
      },
    })

    return NextResponse.json({ enrollments })
  } catch (error) {
    console.error("Error fetching enrollments:", error)
    return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseId, section } = body

    if (!courseId || !section) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // For now, we'll use a placeholder student ID
    // In a real app, this would come from the authenticated user
    const students = await prisma.student.findMany({ take: 1 })
    if (students.length === 0) {
      return NextResponse.json({ error: "No students found" }, { status: 400 })
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        course_id: courseId,
        student_id: students[0].id,
      },
    })

    if (existingEnrollment) {
      return NextResponse.json({ error: "Already enrolled in this course" }, { status: 400 })
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        course_id: courseId,
        student_id: students[0].id,
        section,
        enrolled_at: new Date(),
      },
      include: {
        course: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ enrollment })
  } catch (error) {
    console.error("Error creating enrollment:", error)
    return NextResponse.json({ error: "Failed to create enrollment" }, { status: 500 })
  }
}
