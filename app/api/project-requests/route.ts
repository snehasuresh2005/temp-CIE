import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { LabComponent } from "@prisma/client"
import { getUserById } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Get user from header
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Filter project requests based on user role
    let whereClause: any = {}
    
    if (user.role === "FACULTY") {
      // Faculty can only see project requests where they are the faculty
      const faculty = await prisma.faculty.findUnique({
        where: { user_id: userId },
      })
      if (faculty) {
        whereClause.faculty_id = faculty.id
      }
    } else if (user.role === "STUDENT") {
      // Students can only see their own project requests
      const student = await prisma.student.findUnique({
        where: { user_id: userId },
      })
      if (student) {
        whereClause.student_id = student.id
      }
    }
    // For admin or other roles, show all project requests (no filter)

    const projectRequests = await prisma.projectRequest.findMany({
      where: whereClause,
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