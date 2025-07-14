import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all coordinator assignments using the existing DomainCoordinator table
    const assignments = await prisma.domainCoordinator.findMany({
      include: {
        faculty: {
          include: {
            user: true
          }
        },
        domain: true
      }
    })

    const formattedAssignments = assignments.map(assignment => ({
      id: assignment.id,
      domain_name: assignment.domain.name.toLowerCase().replace(/\s+/g, ''),
      faculty: {
        id: assignment.faculty.id,
        user: {
          name: assignment.faculty.user.name,
          email: assignment.faculty.user.email
        },
        department: assignment.faculty.department
      },
      assigned_at: assignment.assigned_at
    }))

    return NextResponse.json({ 
      assignments: formattedAssignments
    })

  } catch (error) {
    console.error("Error fetching coordinator assignments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}