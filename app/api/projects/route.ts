import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        course: {
          select: {
            code: true,
            name: true,
          },
        },
        submissions: {
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
        },
      },
      orderBy: {
        assignedDate: "desc",
      },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, courseId, section, dueDate, maxMarks } = body

    if (!title || !courseId || !section || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const project = await prisma.project.create({
      data: {
        title,
        description: description || "",
        courseId,
        section,
        assignedDate: new Date().toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        maxMarks: maxMarks || 100,
        attachments: [],
      },
      include: {
        course: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
