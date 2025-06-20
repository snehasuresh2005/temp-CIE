import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Delete related project requests
    await prisma.projectRequest.deleteMany({ where: { project_id: id } })
    // Delete related submissions
    await prisma.projectSubmission.deleteMany({ where: { projectId: id } })
    // Delete the project
    await prisma.project.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
} 