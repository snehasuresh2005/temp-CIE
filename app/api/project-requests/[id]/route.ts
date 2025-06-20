import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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

    // If approved, update the project status to ONGOING
    if (status === "APPROVED") {
      await prisma.project.update({
        where: { id: projectRequest.project_id },
        data: { status: "ONGOING" },
      })
    } else if (status === "REJECTED") {
      await prisma.project.update({
        where: { id: projectRequest.project_id },
        data: { status: "REJECTED" },
      })
    }

    return NextResponse.json({ projectRequest })
  } catch (error) {
    console.error("Error updating project request:", error)
    return NextResponse.json({ error: "Failed to update project request" }, { status: 500 })
  }
} 