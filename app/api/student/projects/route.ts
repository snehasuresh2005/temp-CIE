import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // For now, we'll get projects for the first student
    // In a real app, this would be based on the authenticated user
    const students = await prisma.student.findMany({ take: 1 })
    if (students.length === 0) {
      return NextResponse.json({ projects: [] })
    }

    const studentId = students[0].id

    // Get student's enrolled courses
    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: studentId },
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

    // Get projects for enrolled courses (only faculty-assigned projects)
    const projects = await prisma.project.findMany({
      where: {
        course_id: { in: courseIds },
        type: "FACULTY_ASSIGNED", // Only show faculty-assigned projects
      },
      include: {
        submissions: {
          where: { student_id: studentId },
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
