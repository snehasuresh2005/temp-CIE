import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuth } from "@clerk/nextjs/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId: facultyId } = getAuth(request);
    if (!facultyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json()
    const { id } = params

    // Get the current request
    const currentRequest = await prisma.componentRequest.findUnique({
      where: { id },
      include: { component: true },
    })

    if (!currentRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // Update the request
    const updatedRequest = await prisma.componentRequest.update({
      where: { id },
      data: {
        status: data.status,
        faculty_notes: data.faculty_notes,
        collection_date: data.collection_date ? new Date(data.collection_date) : undefined,
        return_date: data.return_date ? new Date(data.return_date) : undefined,
        approved_by: data.status === "APPROVED" ? facultyId : undefined,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        component: true,
        project: true,
      },
    })

    // Update component availability based on status changes
    if (data.status === "COLLECTED" && currentRequest.status !== "COLLECTED") {
      // Decrease available quantity when collected
      await prisma.labComponent.update({
        where: { id: currentRequest.component_id },
        data: {
          available_quantity: {
            decrement: currentRequest.quantity,
          },
        },
      })
    } else if (data.status === "RETURNED" && currentRequest.status === "PENDING_RETURN") {
      // Increase available quantity when faculty confirms return
      await prisma.labComponent.update({
        where: { id: currentRequest.component_id },
        data: {
          available_quantity: {
            increment: currentRequest.quantity,
          },
        },
      })
    } else if (data.status === "REJECTED" && currentRequest.status === "PENDING") {
      // No quantity change needed for rejection
    }

    return NextResponse.json({ request: updatedRequest })
  } catch (error) {
    console.error("Update component request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
