import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-user-id")
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Remove coordinator assignment using the DomainCoordinator table
    await prisma.domainCoordinator.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ 
      message: "Coordinator assignment removed successfully"
    })

  } catch (error) {
    console.error("Error removing coordinator assignment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}