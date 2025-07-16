import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma, $Enums } from "@prisma/client"
import { getUserById } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // Get user from header
    const userId = request.headers.get("x-user-id")
    console.log("[DEBUG] /api/student/projects userId:", userId)
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

    // Get student's enrolled courses
    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: student.id },
      select: { course_id: true },
    })

    const courseIds = enrollments.map((e) => e.course_id)

    // Get all relevant projects
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          // All projects created by the student (any status)
          { created_by: userId },
          // Projects for enrolled courses
          { course_id: { in: courseIds } },
          // All approved faculty-assigned projects with open enrollment
          {
            type: "FACULTY_ASSIGNED",
            status: "APPROVED",
            enrollment_status: "OPEN"
          },
          // All ongoing faculty-assigned projects where student has an accepted request
          {
            type: "FACULTY_ASSIGNED",
            status: "ONGOING",
            project_requests: {
              some: {
                student_id: student.id,
                status: "APPROVED"
              }
            }
          },
          // All approved student-proposed projects (with accepted_by)
          {
            type: "STUDENT_PROPOSED",
            status: "APPROVED",
            accepted_by: { not: null }
          }
        ],
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
    console.log("[DEBUG] /api/student/projects raw projects:", projects)

    // Get faculty information for faculty-assigned projects
    const facultyAssignedProjects = projects.filter(p => p.type === "FACULTY_ASSIGNED")
    const facultyUserIds = facultyAssignedProjects.map(p => p.created_by).filter(Boolean)
    
    const facultyUsers = await prisma.faculty.findMany({
      where: {
        user_id: { in: facultyUserIds }
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })

    // Create a map of user_id to faculty
    const facultyMap = facultyUsers.reduce((map, faculty) => {
      map[faculty.user_id] = faculty
      return map
    }, {} as Record<string, any>)

    // Transform to include submission directly and faculty information
    const projectsWithSubmissions = projects.map((project) => {
      // For faculty-assigned projects, get the faculty creator information
      const faculty_creator = project.type === "FACULTY_ASSIGNED" && project.created_by 
        ? facultyMap[project.created_by] 
        : null

      // Destructure to remove submissions, then add faculty_creator
      const { submissions, ...projectWithoutSubmissions } = project

      return {
        ...projectWithoutSubmissions,
        submission: submissions[0] || null,
        faculty_creator: faculty_creator ? {
          id: faculty_creator.id,
          user: faculty_creator.user
        } : null,
      }
    })
    console.log("[DEBUG] /api/student/projects projectsWithSubmissions:", projectsWithSubmissions)

    return NextResponse.json({ projects: projectsWithSubmissions })
  } catch (error) {
    console.error("Error fetching student projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}
