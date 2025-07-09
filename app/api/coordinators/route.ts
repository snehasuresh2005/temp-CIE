import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserById } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied - Admin only" }, { status: 403 })
    }

    const body = await request.json()
    const { domain_id, faculty_id } = body

    if (!domain_id || !faculty_id) {
      return NextResponse.json({ 
        error: "Domain ID and Faculty ID are required" 
      }, { status: 400 })
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.domainCoordinator.findUnique({
      where: {
        domain_id_faculty_id: {
          domain_id,
          faculty_id
        }
      }
    })

    if (existingAssignment) {
      return NextResponse.json({ 
        error: "Faculty is already assigned as coordinator for this domain" 
      }, { status: 400 })
    }

    const assignment = await prisma.domainCoordinator.create({
      data: {
        domain_id,
        faculty_id
      },
      include: {
        domain: true,
        faculty: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    })

    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error) {
    console.error("Error creating coordinator assignment:", error)
    return NextResponse.json({ error: "Failed to create coordinator assignment" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied - Admin only" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const domain_id = searchParams.get("domain_id")
    const faculty_id = searchParams.get("faculty_id")

    if (!domain_id || !faculty_id) {
      return NextResponse.json({ 
        error: "Domain ID and Faculty ID are required" 
      }, { status: 400 })
    }

    await prisma.domainCoordinator.delete({
      where: {
        domain_id_faculty_id: {
          domain_id,
          faculty_id
        }
      }
    })

    return NextResponse.json({ message: "Coordinator assignment removed successfully" })
  } catch (error) {
    console.error("Error removing coordinator assignment:", error)
    return NextResponse.json({ error: "Failed to remove coordinator assignment" }, { status: 500 })
  }
}