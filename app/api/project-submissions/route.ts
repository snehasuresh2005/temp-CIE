import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const submissions = await prisma.projectSubmission.findMany({
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
        project: {
          select: {
            name: true,
            description: true,
            expected_completion_date: true,
          },
        },
      },
      orderBy: {
        submission_date: "desc",
      },
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error("Error fetching submissions:", error)
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, content, attachments = [] } = body

    if (!projectId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // For now, we'll use a placeholder student ID
    // In a real app, this would come from the authenticated user
    const students = await prisma.student.findMany({ take: 1 })
    if (students.length === 0) {
      return NextResponse.json({ error: "No students found" }, { status: 400 })
    }

    const submission = await prisma.projectSubmission.create({
      data: {
        projectId,
        studentId: students[0].id,
        content,
        attachments,
        status: "SUBMITTED",
        submissionDate: new Date(),
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
        project: {
          select: {
            name: true,
            description: true,
          },
        },
      },
    })

    return NextResponse.json({ submission })
  } catch (error) {
    console.error("Error creating submission:", error)
    return NextResponse.json({ error: "Failed to create submission" }, { status: 500 })
  }
}
