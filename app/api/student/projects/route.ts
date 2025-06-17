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
      where: { studentId },
      select: { courseId: true, section: true },
    })

    const courseIds = enrollments.map((e) => e.courseId)
    const sections = enrollments.reduce(
      (acc, e) => {
        acc[e.courseId] = e.section
        return acc
      },
      {} as Record<string, string>,
    )

    // Get projects for enrolled courses and sections
    const projects = await prisma.project.findMany({
      where: {
        courseId: { in: courseIds },
        section: { in: Object.values(sections) },
      },
      include: {
        course: {
          select: {
            code: true,
            name: true,
          },
        },
        submissions: {
          where: { studentId },
          take: 1,
        },
      },
      orderBy: {
        dueDate: "asc",
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
