import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserById } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }
    const user = await getUserById(userId)
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied - Admin only" }, { status: 403 })
    }
    const { id } = params
    const body = await request.json()
    const { name, description } = body
    if (!name) {
      return NextResponse.json({ error: "Domain name is required" }, { status: 400 })
    }
    const updated = await prisma.domain.update({
      where: { id },
      data: { name, description },
      include: {
        coordinators: {
          include: {
            faculty: { include: { user: { select: { name: true, email: true } } } }
          }
        },
        _count: { select: { lab_components: true, library_items: true } }
      }
    })
    return NextResponse.json({ domain: updated })
  } catch (error) {
    console.error("Error updating domain:", error)
    return NextResponse.json({ error: "Failed to update domain" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }
    const user = await getUserById(userId)
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied - Admin only" }, { status: 403 })
    }
    const { id } = params
    // Remove all coordinator assignments for this domain
    await prisma.domainCoordinator.deleteMany({ where: { domain_id: id } })
    // Delete the domain
    await prisma.domain.delete({ where: { id } })
    return NextResponse.json({ message: "Domain deleted successfully" })
  } catch (error) {
    console.error("Error deleting domain:", error)
    return NextResponse.json({ error: "Failed to delete domain" }, { status: 500 })
  }
} 