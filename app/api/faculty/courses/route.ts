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

    // Get faculty's courses with enrollments
    const courses = await prisma.course.findMany({
      where: { faculty_id: faculty.id },
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
        code: "asc",
      },
    })

    return NextResponse.json({ courses })
  } catch (error) {
    console.error("Error fetching faculty courses:", error)
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
  }
} 