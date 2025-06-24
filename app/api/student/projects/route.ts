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
        project_requests: {
          include: {
            faculty: {
              include: {
                user: {
                  select: { name: true, email: true }
                }
              }
            }
          },
          orderBy: {
            request_date: 'desc'
          }
        }
      },
      orderBy: {
        expected_completion_date: "asc",
      },
    })

    // Get faculty information for faculty-assigned projects
    const facultyAssignedProjects = projects.filter(p => p.type === "FACULTY_ASSIGNED")
    const courseIdsForFaculty = facultyAssignedProjects.map(p => p.course_id)
    
    const coursesWithFaculty = await prisma.course.findMany({
      where: {
        id: { in: courseIdsForFaculty }
      },
      include: {
        faculty: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    })

    // Create a map of course_id to faculty
    const courseFacultyMap = coursesWithFaculty.reduce((acc, course) => {
      acc[course.id] = course.faculty
      return acc
    }, {} as Record<string, any>)

    // Transform to include submission directly and faculty information
    const projectsWithSubmissions = projects.map((project) => {
      // For faculty-assigned projects, use the course faculty as faculty_creator
      const faculty_creator = project.type === "FACULTY_ASSIGNED" ? {
        user: courseFacultyMap[project.course_id]?.user
      } : null

      // Destructure to remove submissions, then add faculty_creator
      const { submissions, ...projectWithoutSubmissions } = project

      return {
        ...projectWithoutSubmissions,
        submission: submissions[0] || null,
        faculty_creator,
      }
    })

    return NextResponse.json({ projects: projectsWithSubmissions })
  } catch (error) {
    console.error("Error fetching student projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}
