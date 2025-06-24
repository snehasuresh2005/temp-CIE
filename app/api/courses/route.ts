import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserById } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const courses = await prisma.course.findMany({
      include: {
        enrollments: {
          include: {
            student: {
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
        created_date: "desc"
      }
    })

    return NextResponse.json({ courses })
  } catch (error) {
    console.error("Get courses error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from header
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user || (user.role !== "faculty" && user.role !== "admin")) {
      return NextResponse.json({ error: "Access denied - Faculty or Admin only" }, { status: 403 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.course_name || !data.course_description || !data.course_start_date || !data.course_end_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const course = await prisma.course.create({
      data: {
        course_name: data.course_name,
        course_description: data.course_description,
        course_start_date: new Date(data.course_start_date),
        course_end_date: new Date(data.course_end_date),
        course_enrollments: [],
        created_by: userId,
      },
      include: {
        enrollments: {
          include: {
            student: {
              include: {
                user: {
                  select: { name: true, email: true }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ course })
  } catch (error) {
    console.error("Create course error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get user from header
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user || (user.role !== "faculty" && user.role !== "admin")) {
      return NextResponse.json({ error: "Access denied - Faculty or Admin only" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("id")

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
    }

    // Check if user can delete this course (admin can delete any, faculty can only delete their own)
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (user.role === "faculty" && course.created_by !== userId) {
      return NextResponse.json({ error: "Access denied - You can only delete courses you created" }, { status: 403 })
    }

    // Delete related data first
    await prisma.enrollment.deleteMany({
      where: { course_id: courseId }
    })

    await prisma.project.deleteMany({
      where: { course_id: courseId }
    })

    await prisma.classSchedule.deleteMany({
      where: { course_id: courseId }
    })

    // Delete the course
    await prisma.course.delete({
      where: { id: courseId }
    })

    return NextResponse.json({ message: "Course deleted successfully" })
  } catch (error) {
    console.error("Delete course error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get user from header
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Access denied - Students only" }, { status: 403 })
    }

    const data = await request.json()
    const { courseId, action } = data
    if (!courseId || action !== "enroll") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    // Find the course
    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Check if already enrolled
    if (course.course_enrollments.includes(userId)) {
      return NextResponse.json({ error: "Already enrolled in this course" }, { status: 400 })
    }

    // Add user to course_enrollments
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        course_enrollments: {
          set: [...course.course_enrollments, userId]
        },
        modified_by: userId,
      },
    })

    return NextResponse.json({ course: updatedCourse })
  } catch (error) {
    console.error("Enroll in course error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
