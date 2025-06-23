import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const courses = await prisma.course.findMany({
      include: {
        faculty: {
          include: {
            user: true,
          },
        },
        enrollments: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ courses })
  } catch (error) {
    console.error("Get courses error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const course = await prisma.course.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        credits: data.credits,
        department: data.department,
        semester: data.semester,
        max_students: data.maxStudents || data.max_students,
        sections: data.sections,
        faculty_id: data.facultyId || data.faculty_id,
      },
      include: {
        faculty: {
          include: {
            user: true,
          },
        },
      },
    })

    return NextResponse.json({ course })
  } catch (error) {
    console.error("Create course error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
