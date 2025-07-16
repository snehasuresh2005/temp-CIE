import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserById } from "@/lib/auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { status, faculty_notes } = body

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Get user from header for authorization
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user || user.role !== "FACULTY") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get the project request first to verify faculty owns the project
    const existingRequest = await prisma.projectRequest.findUnique({
      where: { id },
      include: {
        project: true,
      },
    })

    if (!existingRequest) {
      return NextResponse.json({ error: "Project request not found" }, { status: 404 })
    }

    // Verify faculty owns the project
    if (existingRequest.project.created_by !== userId) {
      return NextResponse.json({ 
        error: "Access denied - You can only manage applications for your own projects" 
      }, { status: 403 })
    }

    const updateData: any = {
      status,
      faculty_notes: faculty_notes || null,
    }

    if (status === "APPROVED") {
      updateData.accepted_date = new Date()
    } else if (status === "REJECTED") {
      updateData.rejected_date = new Date()
    }

    const projectRequest = await prisma.projectRequest.update({
      where: { id },
      data: updateData,
      include: {
        project: true,
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
        faculty: {
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
    })

    // If approved, check enrollment cap and update project status if needed
    if (status === "APPROVED") {
      const project = await prisma.project.findUnique({
        where: { id: projectRequest.project_id },
        include: {
          project_requests: {
            where: { status: "APPROVED" }
          }
        }
      })

      if (project) {
        // Count approved requests including this one
        const approvedCount = project.project_requests.length

        // If we've reached the enrollment cap, set project to ONGOING
        if (project.enrollment_cap && approvedCount >= project.enrollment_cap) {
          await prisma.project.update({
            where: { id: projectRequest.project_id },
            data: { 
              status: "ONGOING",
              enrollment_status: "CLOSED",
              enrollment_end_date: new Date()
            },
          })
        }
      }
    }

    return NextResponse.json({ projectRequest })
  } catch (error) {
    console.error("Error updating project request:", error)
    return NextResponse.json({ error: "Failed to update project request" }, { status: 500 })
  }
}

// Add PATCH method as alias for PUT
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return PUT(request, { params })
}