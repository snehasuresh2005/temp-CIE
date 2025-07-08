import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the faculty record for this user
    const faculty = await prisma.faculty.findUnique({
      where: { user_id: userId },
      include: {
        user: true,
        domain_assignments: {
          include: {
            domain: true
          }
        }
      }
    })

    if (!faculty) {
      return NextResponse.json({ isCoordinator: false })
    }

    const isCoordinator = faculty.domain_assignments.length > 0
    
    return NextResponse.json({ 
      isCoordinator,
      assignedDomains: faculty.domain_assignments.map(assignment => ({
        id: assignment.domain.id,  // Use actual database ID instead of transformed name
        name: assignment.domain.name,
        description: assignment.domain.description
      }))
    })

  } catch (error) {
    console.error("Error checking coordinator status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}