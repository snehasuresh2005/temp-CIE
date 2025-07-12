import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserById } from "@/lib/auth"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get user from header
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user || user.role !== "FACULTY") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get faculty record
    const faculty = await prisma.faculty.findUnique({
      where: { user_id: userId },
    })

    if (!faculty) {
      return NextResponse.json({ error: "Faculty profile not found" }, { status: 404 })
    }

    const enrollmentId = params.id
    const body = await request.json()
    const { grade } = body

    if (!grade) {
      return NextResponse.json({ error: "Grade is required" }, { status: 400 })
    }

    // Get the enrollment and verify faculty owns the course
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: true
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
    }

    // Verify faculty owns the course
    if (enrollment.course.faculty_id !== faculty.id) {
      return NextResponse.json({ error: "Access denied - You can only grade students in your courses" }, { status: 403 })
    }

    // Update the grade
    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { grade },
      include: {
        student: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        course: {
          select: { code: true, name: true }
        }
      }
    })

    return NextResponse.json({ enrollment: updatedEnrollment })
  } catch (error) {
    console.error("Error updating enrollment grade:", error)
    return NextResponse.json({ error: "Failed to update grade" }, { status: 500 })
  }
} 