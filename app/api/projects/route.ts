import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserById } from "@/lib/auth"

// Placeholder in-memory store
let projects: any[] = []

export async function GET(req: NextRequest) {
  // Return all projects from the database
  const projects = await prisma.project.findMany()
  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const data = await req.json()
  // Create a new project in the database, including mentor email
  const newProject = await prisma.project.create({
    data: {
      name: data.title,
      description: data.description || "",
      studentsRequired: Number(data.studentsRequired) || 1,
      mentor: data.mentor,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      department: data.department,
      created_by: data.created_by || "admin", // fallback
      created_date: new Date(),
      modified_date: new Date(),
      status: "PENDING",
      type: "FACULTY_ASSIGNED",
    },
  })
  return NextResponse.json(newProject, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  try {
    // Get user from header
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user || (user.role !== "faculty" && user.role !== "student")) {
      return NextResponse.json({ error: "Access denied - Faculty or Student only" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("id")

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    // Check if project exists and if user can delete it
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Users can only delete projects they created
    if (project.created_by !== userId) {
      return NextResponse.json({ error: "Access denied - You can only delete projects you created" }, { status: 403 })
    }

    // Delete related data first (cascade delete)
    await prisma.projectSubmission.deleteMany({
      where: { project_id: projectId }
    })

    await prisma.projectRequest.deleteMany({
      where: { project_id: projectId }
    })

    // Delete the project
    await prisma.project.delete({
      where: { id: projectId }
    })

    return NextResponse.json({ message: "Project deleted successfully" })
  } catch (error) {
    console.error("Delete project error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

