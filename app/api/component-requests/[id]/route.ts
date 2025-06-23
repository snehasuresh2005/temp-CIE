import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserById } from "@/lib/auth"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get user from header
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    const data = await request.json()
    const { id } = params

    // Get the current request
    const currentRequest = await prisma.componentRequest.findUnique({
      where: { id },
      include: { component: true, student: true },
    })

    if (!currentRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // STUDENT: Allow marking as PENDING_RETURN only if this is their own request
    if (user.role === "student" && data.status === "PENDING_RETURN") {
      // Get student record
      const student = await prisma.student.findUnique({ where: { user_id: userId } })
      if (!student || currentRequest.student_id !== student.id) {
        return NextResponse.json({ error: "Access denied - Not your request" }, { status: 403 })
      }
      const updatedRequest = await prisma.componentRequest.update({
        where: { id },
        data: {
          status: "PENDING_RETURN",
          return_date: data.return_date ? new Date(data.return_date) : undefined,
        },
        include: {
          student: { include: { user: true } },
          component: true,
          project: true,
        },
      })
      return NextResponse.json({ request: updatedRequest })
    }

    // FACULTY: Only faculty can approve/collect/confirm return
    if (user.role !== "faculty") {
      return NextResponse.json({ error: "Access denied - Faculty only" }, { status: 403 })
    }

    // Get faculty record to get the faculty ID
    const faculty = await prisma.faculty.findUnique({
      where: { user_id: userId },
    })

    if (!faculty) {
      return NextResponse.json({ error: "Faculty profile not found" }, { status: 404 })
    }

    // Update the request (faculty actions)
    const updatedRequest = await prisma.componentRequest.update({
      where: { id },
      data: {
        status: data.status,
        notes: data.faculty_notes,
        approved_date: data.status === "APPROVED" ? new Date() : undefined,
        approved_by: data.status === "APPROVED" ? faculty.id : undefined,
      },
      include: {
        student: { include: { user: true } },
        component: true,
        project: true,
      },
    })

    // Note: Component quantity management is handled in the lab-components API
    // The available quantity is calculated dynamically based on approved/collected requests

    return NextResponse.json({ request: updatedRequest })
  } catch (error) {
    console.error("Update component request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
