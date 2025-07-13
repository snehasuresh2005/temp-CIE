import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const enrollments = await prisma.enrollment.findMany({
      include: {
        course: {
          select: {
            course_code: true,
            course_name: true,
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
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }
    const student = await prisma.student.findUnique({ where: { user_id: userId } })
    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        course_id: courseId,
        student_id: student.id,
      },
    })

    if (existingEnrollment) {
      return NextResponse.json({ error: "Already enrolled in this course" }, { status: 400 })
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        course_id: courseId,
        student_id: student.id,
        enrolled_at: new Date(),
      },
      include: {
        course: {
          select: {
            course_code: true,
            course_name: true,
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
