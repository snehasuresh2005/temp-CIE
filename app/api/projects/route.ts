import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        submissions: {
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
          },
        },
        project_requests: {
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
        created_date: "desc",
      },
    })

    // Fetch all lab components
    const allComponents = await prisma.labComponent.findMany()

    // For faculty-assigned projects, we need to get the faculty information
    const projectsWithFaculty = await Promise.all(
      projects.map(async (project) => {
        // Map components_needed to full component objects
        const components_needed_details = (project.components_needed || [])
          .map((id) => allComponents.find((c) => c.id === id))
          .filter(Boolean)

        if (project.type === "FACULTY_ASSIGNED" && project.created_by) {
          // Find the faculty who created this project by user ID
          const faculty = await prisma.faculty.findFirst({
            where: {
              user_id: project.created_by,
            },
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          })
          if (faculty) {
            return {
              ...project,
              faculty_creator: faculty,
              components_needed_details,
            }
          }
        }
        return {
          ...project,
          components_needed_details,
        }
      })
    )

    return NextResponse.json({ projects: projectsWithFaculty })
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

    let created_by = ""
    let project_data: any = {
      name,
      description: description || "",
      course_id,
      components_needed: components_needed || [],
      expected_completion_date: new Date(expected_completion_date),
      type,
      created_date: new Date(),
      modified_date: new Date(),
    }

    if (user.role === "FACULTY") {
      // Faculty creating a project
      if (!user.faculty) {
        return NextResponse.json({ error: "Faculty profile not found" }, { status: 404 })
      }
      created_by = user.id
      project_data.created_by = created_by
      project_data.status = "PENDING" // Faculty projects are immediately available
    } else if (user.role === "STUDENT") {
      // Student creating a project proposal
      if (!user.student) {
        return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
      }
      if (!accepted_by) {
        return NextResponse.json({ error: "Faculty must be selected for student projects" }, { status: 400 })
      }
      created_by = user.id
      project_data.created_by = created_by
      project_data.accepted_by = accepted_by
      project_data.status = "PENDING" // Student projects need approval
      project_data.type = "STUDENT_PROPOSED"
    } else {
      return NextResponse.json({ error: "Only faculty and students can create projects" }, { status: 403 })
    }

    const project = await prisma.project.create({
      data: project_data,
      include: {
        submissions: true,
        project_requests: {
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
    })

    // If student created project, create a project request
    if (user.role === "STUDENT" && accepted_by && user.student) {
      await prisma.projectRequest.create({
        data: {
          project_id: project.id,
          student_id: user.student.id,
          faculty_id: accepted_by,
          request_date: new Date(),
          status: "PENDING",
        },
      })
      
      // Fetch the updated project with the new project request
      const updatedProject = await prisma.project.findUnique({
        where: { id: project.id },
        include: {
          submissions: true,
          project_requests: {
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
      })
      
      return NextResponse.json({ project: updatedProject })
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}

