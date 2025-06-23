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
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get student record
    const student = await prisma.student.findUnique({
      where: { user_id: userId },
    })

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
    }

    // Get student's enrolled courses
    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: student.id },
      select: { course_id: true, section: true },
    })

    const courseIds = enrollments.map((e) => e.course_id)
    const sections = enrollments.reduce(
      (acc, e) => {
        acc[e.course_id] = e.section
        return acc
      },
      {} as Record<string, string>,
    )

    // Get projects for enrolled courses (faculty-assigned and student-proposed projects)
    const projects = await prisma.project.findMany({
      where: {
        course_id: { in: courseIds },
        type: { in: ["FACULTY_ASSIGNED", "STUDENT_PROPOSED"] },
      },
      include: {
        submissions: {
          where: { student_id: student.id },
          take: 1,
        },
      },
      orderBy: {
        expected_completion_date: "asc",
      },
    })

    // Transform to include submission directly
    const projectsWithSubmissions = projects.map((project) => ({
      ...project,
      submission: project.submissions[0] || null,
      submissions: undefined,
    }))

    return NextResponse.json({ projects: projectsWithSubmissions })
  } catch (error) {
    console.error("Error fetching student projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}
