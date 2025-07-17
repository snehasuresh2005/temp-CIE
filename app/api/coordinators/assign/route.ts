import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    const { domain_id, domain_name, faculty_id } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if ((!domain_id && !domain_name) || !faculty_id) {
      return NextResponse.json({ error: "Domain and faculty are required" }, { status: 400 })
    }

    let domain = null
    if (domain_id) {
      domain = await prisma.domain.findUnique({ where: { id: domain_id } })
      if (!domain) {
        return NextResponse.json({ error: "Domain not found" }, { status: 404 })
      }
    } else if (domain_name) {
      domain = await prisma.domain.findFirst({
        where: {
          name: {
            contains: domain_name,
            mode: 'insensitive'
          }
        }
      })
      if (!domain) {
        // Create the domain if it doesn't exist
        domain = await prisma.domain.create({
          data: {
            name: domain_name,
            description: `${domain_name} domain for CIE management`
          }
        })
      }
    }

    // Check if this faculty is already assigned to this domain
    const existingAssignment = await prisma.domainCoordinator.findUnique({
      where: {
        domain_id_faculty_id: {
          domain_id: domain.id,
          faculty_id: faculty_id
        }
      }
    })

    if (existingAssignment) {
      return NextResponse.json({ error: "Faculty is already assigned to this domain" }, { status: 400 })
    }

    // Create the coordinator assignment
    const assignment = await prisma.domainCoordinator.create({
      data: {
        domain_id: domain.id,
        faculty_id: faculty_id,
        assigned_by: userId
      },
      include: {
        faculty: {
          include: {
            user: true
          }
        },
        domain: true
      }
    })

    return NextResponse.json({ 
      message: "Coordinator assigned successfully",
      assignment: {
        id: assignment.id,
        domain_name: assignment.domain.name,
        faculty: {
          id: assignment.faculty.id,
          user: {
            name: assignment.faculty.user.name,
            email: assignment.faculty.user.email
          },
          department: assignment.faculty.department
        },
        assigned_at: assignment.assigned_at
      }
    })

  } catch (error) {
    console.error("Error assigning coordinator:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}