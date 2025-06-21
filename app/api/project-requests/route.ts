import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { LabComponent } from "@prisma/client"

export async function GET() {
  try {
    const projectRequests = await prisma.projectRequest.findMany({
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
      orderBy: {
        request_date: "desc",
      },
    })

    const labComponents = await prisma.labComponent.findMany()
    const labComponentsMap = labComponents.reduce(
      (acc: Record<string, LabComponent>, component) => {
        acc[component.id] = component
        return acc
      },
      {},
    )

    const projectRequestsWithComponentDetails = projectRequests.map((request) => {
      const componentsNeeded = request.project.components_needed || []
      const componentsNeededDetails = componentsNeeded
        .map((id: string) => labComponentsMap[id])
        .filter(Boolean)

      return {
        ...request,
        project: {
          ...request.project,
          components_needed_details: componentsNeededDetails,
        },
      }
    })

    return NextResponse.json({
      projectRequests: projectRequestsWithComponentDetails,
    })
  } catch (error) {
    console.error("Error fetching project requests:", error)
    return NextResponse.json(
      { error: "Failed to fetch project requests" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { project_id, student_id, faculty_id, student_notes } = body

    if (!project_id || !student_id || !faculty_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const projectRequest = await prisma.projectRequest.create({
      data: {
        project_id,
        student_id,
        faculty_id,
        request_date: new Date(),
        status: "PENDING",
        student_notes: student_notes || null,
      },
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

    return NextResponse.json({ projectRequest })
  } catch (error) {
    console.error("Error creating project request:", error)
    return NextResponse.json({ error: "Failed to create project request" }, { status: 500 })
  }
} 