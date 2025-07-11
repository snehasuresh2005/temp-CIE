import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserById } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // Get user from header
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get student record
    const student = await prisma.student.findUnique({
      where: { user_id: userId },
    })

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
    }

    // Get student's enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: student.id },
      include: {
        course: {
          include: {
            faculty: {
              include: {
                user: {
                  select: { name: true, email: true }
                }
              }
            }
          }
        }
      },
      orderBy: {
        enrolled_at: "desc",
      },
    })

    return NextResponse.json({ enrollments })
  } catch (error) {
    console.error("Error fetching student enrollments:", error)
    return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Get user from header
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get student record
    const student = await prisma.student.findUnique({
      where: { user_id: userId },
    })

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
    }

    const body = await request.json()
    const { courseId, section } = body

    if (!courseId || !section) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
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

    // Check if course is full
    const currentEnrollments = await prisma.enrollment.count({
      where: { course_id: courseId }
    })

    if (currentEnrollments >= course.max_students) {
      return NextResponse.json({ error: "Course is full" }, { status: 400 })
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        course_id: courseId,
        student_id: student.id,
        section,
        enrolled_at: new Date(),
      },
      include: {
        course: {
          include: {
            faculty: {
              include: {
                user: {
                  select: { name: true, email: true }
                }
              }
            }
          }
        }
      },
    })

    return NextResponse.json({ enrollment })
  } catch (error) {
    console.error("Error creating enrollment:", error)
    return NextResponse.json({ error: "Failed to create enrollment" }, { status: 500 })
  }
} 