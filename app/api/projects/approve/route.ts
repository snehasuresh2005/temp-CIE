import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserById } from "@/lib/auth"

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user || user.role !== "FACULTY") {
      return NextResponse.json({ error: "Access denied - Faculty only" }, { status: 403 })
    }

    // Check if user is a coordinator for the Lab Components domain
    const faculty = await prisma.faculty.findUnique({
      where: { user_id: userId },
      include: {
        domain_assignments: {
          include: {
            domain: true
          }
        }
      }
    })

    if (!faculty) {
      return NextResponse.json({ error: "Faculty profile not found" }, { status: 404 })
    }

    // Check if faculty is coordinator for Lab Components domain
    const isLabComponentsCoordinator = faculty.domain_assignments.some(
      assignment => assignment.domain.name === "Lab Components"
    )

    if (!isLabComponentsCoordinator) {
      return NextResponse.json({ 
        error: "Access denied - Only Lab Components coordinators can approve projects" 
      }, { status: 403 })
    }

    const body = await request.json()
    const { project_id, status, notes } = body

    if (!project_id || !status) {
      return NextResponse.json({ 
        error: "Project ID and status are required" 
      }, { status: 400 })
    }

    if (!["ONGOING", "REJECTED"].includes(status)) {
      return NextResponse.json({ 
        error: "Invalid status. Must be ONGOING or REJECTED" 
      }, { status: 400 })
    }

    // Update the project status
    const updatedProject = await prisma.project.update({
      where: { id: project_id },
      data: {
        status: status as "ONGOING" | "REJECTED",
        modified_by: userId,
        modified_date: new Date(),
        // You could add a notes field to the project model if needed
      },
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

    return NextResponse.json({ 
      project: updatedProject,
      message: `Project ${status.toLowerCase()} successfully`
    })

  } catch (error) {
    console.error("Error approving/rejecting project:", error)
    return NextResponse.json({ error: "Failed to update project status" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user || user.role !== "FACULTY") {
      return NextResponse.json({ error: "Access denied - Faculty only" }, { status: 403 })
    }

    // Check if user is a coordinator for the Lab Components domain
    const faculty = await prisma.faculty.findUnique({
      where: { user_id: userId },
      include: {
        domain_assignments: {
          include: {
            domain: true
          }
        }
      }
    })

    if (!faculty) {
      return NextResponse.json({ error: "Faculty profile not found" }, { status: 404 })
    }

    // Check if faculty is coordinator for Lab Components domain
    const isLabComponentsCoordinator = faculty.domain_assignments.some(
      assignment => assignment.domain.name === "Lab Components"
    )

    if (!isLabComponentsCoordinator) {
      return NextResponse.json({ 
        error: "Access denied - Only Lab Components coordinators can view pending projects" 
      }, { status: 403 })
    }

    // Fetch all pending faculty projects
    const pendingProjects = await prisma.project.findMany({
      where: {
        status: "PENDING",
        type: "FACULTY_ASSIGNED"
      },
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
      orderBy: {
        created_date: "desc",
      },
    })

    // Fetch all lab components to map components_needed
    const allComponents = await prisma.labComponent.findMany()

    // For faculty-assigned projects, we need to get the faculty information
    const projectsWithFaculty = await Promise.all(
      pendingProjects.map(async (project) => {
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
    console.error("Error fetching pending projects:", error)
    return NextResponse.json({ error: "Failed to fetch pending projects" }, { status: 500 })
  }
} 