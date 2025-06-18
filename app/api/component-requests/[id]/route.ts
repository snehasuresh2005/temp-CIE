import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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
        facultyNotes: data.facultyNotes,
        collectionDate: data.collectionDate ? new Date(data.collectionDate) : undefined,
        returnDate: data.returnDate ? new Date(data.returnDate) : undefined,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        component: true,
      },
    })

    // Update component availability based on status changes
    if (data.status === "COLLECTED" && currentRequest.status !== "COLLECTED") {
      // Decrease available quantity when collected
      await prisma.labComponent.update({
        where: { id: currentRequest.componentId },
        data: {
          availableQuantity: {
            decrement: currentRequest.quantity,
          },
        },
      })
    } else if (data.status === "RETURNED" && currentRequest.status === "PENDING_RETURN") {
      // Increase available quantity when faculty confirms return
      await prisma.labComponent.update({
        where: { id: currentRequest.componentId },
        data: {
          availableQuantity: {
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
