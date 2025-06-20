import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        submissions: true,
        projectRequests: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            faculty: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdDate: "desc",
      },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      description, 
      course_id, 
      components_needed, 
      expected_completion_date,
      accepted_by, // Only for student-created projects
      type = "FACULTY_ASSIGNED", // Default to faculty assigned
      user_email // We'll get this from the request for now
    } = body

    if (!name || !course_id || !expected_completion_date || !user_email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { email: user_email },
      include: { faculty: true, student: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let createdBy = ""
    let project_data: any = {
      name,
      description: description || "",
      courseId: course_id,
      componentsNeeded: components_needed || [],
      expectedCompletionDate: new Date(expected_completion_date),
      type,
      createdDate: new Date(),
      modifiedDate: new Date(),
    }

    if (user.role === "FACULTY") {
      // Faculty creating a project
      if (!user.faculty) {
        return NextResponse.json({ error: "Faculty profile not found" }, { status: 404 })
      }
      createdBy = user.id
      project_data.createdBy = createdBy
      project_data.acceptedBy = user.faculty.id
      project_data.status = "PENDING" // Faculty projects are immediately available
    } else if (user.role === "STUDENT") {
      // Student creating a project proposal
      if (!user.student) {
        return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
      }
      if (!accepted_by) {
        return NextResponse.json({ error: "Faculty must be selected for student projects" }, { status: 400 })
      }
      createdBy = user.id
      project_data.createdBy = createdBy
      project_data.acceptedBy = accepted_by
      project_data.status = "PENDING" // Student projects need approval
      project_data.type = "STUDENT_PROPOSED"
    } else {
      return NextResponse.json({ error: "Only faculty and students can create projects" }, { status: 403 })
    }

    const project = await prisma.project.create({
      data: project_data,
      include: {
        submissions: true,
        projectRequests: true,
      },
    })

    // If student created project, create a project request
    if (user.role === "STUDENT" && accepted_by && user.student) {
      await prisma.projectRequest.create({
        data: {
          projectId: project.id,
          studentId: user.student.id,
          facultyId: accepted_by,
          requestDate: new Date(),
          status: "PENDING",
        },
      })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
