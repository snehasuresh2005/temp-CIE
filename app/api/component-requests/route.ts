import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const requests = await prisma.componentRequest.findMany({
      include: {
        student: {
          include: {
            user: true,
          },
        },
        component: true,
        faculty: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        requestDate: "desc",
      },
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Get component requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Get current user session (you'll need to implement this based on your auth)
    // For now, we'll use a placeholder student ID
    const studentId = "student_profile1" // This should come from the authenticated user

    // Check if component exists and has enough quantity
    const component = await prisma.labComponent.findUnique({
      where: { id: data.componentId },
    })

    if (!component) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 })
    }

    if (component.availableQuantity < data.quantity) {
      return NextResponse.json({ error: "Insufficient quantity available" }, { status: 400 })
    }

    // Create the request
    const request = await prisma.componentRequest.create({
      data: {
        studentId: studentId,
        componentId: data.componentId,
        quantity: data.quantity,
        expectedReturnDate: new Date(data.expectedReturnDate),
        notes: data.notes,
        status: "PENDING",
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

    return NextResponse.json({ request })
  } catch (error) {
    console.error("Create component request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
