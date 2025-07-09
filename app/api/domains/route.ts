import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserById } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const domains = await prisma.domain.findMany({
      include: {
        coordinators: {
          include: {
            faculty: {
              include: {
                user: {
                  select: { name: true, email: true }
                }
              }
            }
          }
        },
        _count: {
          select: {
            lab_components: true,
            library_items: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ domains })
  } catch (error) {
    console.error("Error fetching domains:", error)
    return NextResponse.json({ error: "Failed to fetch domains" }, { status: 500 })
  }
}

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
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: "Domain name is required" }, { status: 400 })
    }

    const domain = await prisma.domain.create({
      data: {
        name,
        description: description || null
      },
      include: {
        coordinators: {
          include: {
            faculty: {
              include: {
                user: {
                  select: { name: true, email: true }
                }
              }
            }
          }
        },
        _count: {
          select: {
            lab_components: true,
            library_items: true
          }
        }
      }
    })

    return NextResponse.json({ domain }, { status: 201 })
  } catch (error) {
    console.error("Error creating domain:", error)
    return NextResponse.json({ error: "Failed to create domain" }, { status: 500 })
  }
}