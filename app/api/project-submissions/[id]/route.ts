import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { marks, feedback, status } = body

    const submission = await prisma.projectSubmission.update({
      where: { id: params.id },
      data: {
        marks: marks !== undefined ? marks : undefined,
        feedback: feedback !== undefined ? feedback : undefined,
        status: status !== undefined ? status : undefined,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ submission })
  } catch (error) {
    console.error("Error updating submission:", error)
    return NextResponse.json({ error: "Failed to update submission" }, { status: 500 })
  }
}
