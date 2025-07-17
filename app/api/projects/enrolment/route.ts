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

    const faculty = await prisma.faculty.findUnique({
      where: { user_id: userId },
    })

    if (!faculty) {
      return NextResponse.json({ error: "Faculty profile not found" }, { status: 404 })
    }

    const body = await request.json()
    const { project_id, action, enrollment_cap } = body

    if (!project_id || !action) {
      return NextResponse.json({ 
        error: "Project ID and action are required" 
      }, { status: 400 })
    }

    if (!["start", "close", "reopen"].includes(action)) {
      return NextResponse.json({ 
        error: "Invalid action. Must be 'start', 'close', or 'reopen'" 
      }, { status: 400 })
    }

    // Check if faculty owns this project
    const project = await prisma.project.findUnique({
      where: { id: project_id },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.created_by !== userId) {
      return NextResponse.json({ 
        error: "Access denied - You can only manage enrollment for your own projects" 
      }, { status: 403 })
    }

    if (project.status !== "APPROVED") {
      return NextResponse.json({ 
        error: "Project must be approved before managing enrollment" 
      }, { status: 400 })
    }

    let updateData: any = {
      modified_by: userId,
      modified_date: new Date(),
    }

    if (action === "start") {
      if (!enrollment_cap || enrollment_cap < 1) {
        return NextResponse.json({ 
          error: "Valid enrollment cap is required to start enrollment" 
        }, { status: 400 })
      }

      if (project.enrollment_status !== "NOT_STARTED") {
        return NextResponse.json({ 
          error: "Enrollment can only be started for projects that haven't started enrollment yet" 
        }, { status: 400 })
      }

      updateData = {
        ...updateData,
        enrollment_status: "OPEN",
        enrollment_cap: enrollment_cap,
        enrollment_start_date: new Date(),
      }
    } else if (action === "close") {
      if (project.enrollment_status !== "OPEN") {
        return NextResponse.json({ 
          error: "Enrollment can only be closed for projects with open enrollment" 
        }, { status: 400 })
      }

      updateData = {
        ...updateData,
        enrollment_status: "CLOSED",
        enrollment_end_date: new Date(),
      }
    } else if (action === "reopen") {
      if (project.enrollment_status !== "CLOSED") {
        return NextResponse.json({ 
          error: "Enrollment can only be reopened for projects with closed enrollment" 
        }, { status: 400 })
      }

      updateData = {
        ...updateData,
        enrollment_status: "OPEN",
        enrollment_end_date: null, // Clear the end date when reopening
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id: project_id },
      data: updateData,
      include: {
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
          },
        },
      },
    })

    return NextResponse.json({ 
      project: updatedProject,
      message: `Enrollment ${action === "start" ? "started" : "closed"} successfully`
    })

  } catch (error) {
    console.error("Error managing project enrollment:", error)
    return NextResponse.json({ error: "Failed to manage project enrollment" }, { status: 500 })
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

    const faculty = await prisma.faculty.findUnique({
      where: { user_id: userId },
    })

    if (!faculty) {
      return NextResponse.json({ error: "Faculty profile not found" }, { status: 404 })
    }

    // Get faculty's approved projects that can have enrollment managed
    const projects = await prisma.project.findMany({
      where: {
        created_by: userId,
        status: "APPROVED",
        type: "FACULTY_ASSIGNED"
      },
      include: {
        project_requests: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: {
            request_date: "desc",
          },
        },
      },
      orderBy: {
        created_date: "desc",
      },
    })

    // Fetch all lab components to map components_needed
    const allComponents = await prisma.labComponent.findMany()

    const projectsWithDetails = projects.map((project) => {
      const components_needed_details = (project.components_needed || [])
        .map((id) => allComponents.find((c) => c.id === id))
        .filter(Boolean)

      return {
        ...project,
        components_needed_details,
      }
    })

    return NextResponse.json({ projects: projectsWithDetails })

  } catch (error) {
    console.error("Error fetching faculty projects for enrollment:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}
