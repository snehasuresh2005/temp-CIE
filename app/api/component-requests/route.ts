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

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    // Get current user session (you'll need to implement this based on your auth)
    // For now, we'll get the first available student
    const students = await prisma.student.findMany({ take: 1 })
    if (students.length === 0) {
      return NextResponse.json({ error: "No students found in database" }, { status: 400 })
    }
    const studentId = students[0].id

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
        expectedReturnDate: new Date(data.requiredDate || data.expectedReturnDate),
        notes: data.purpose || data.notes,
        status: "PENDING",
        facultyId: data.facultyId || null,
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
