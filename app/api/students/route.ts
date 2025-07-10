import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: true,
        enrollments: {
          include: {
            course: true,
          },
        },
      },
    })

    return NextResponse.json({ students })
  } catch (error) {
    console.error("Get students error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phone,
      password,
      student_id,
      program,
      year,
      section,
      gpa,
    } = body

    if (!name || !email || !password || !student_id || !program) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      )
    }

    const existingStudent = await prisma.student.findUnique({
      where: { student_id },
    })

    if (existingStudent) {
      return NextResponse.json(
        { error: "Student with this ID already exists" },
        { status: 409 },
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newStudent = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          role: "STUDENT",
        },
      })

      const student = await tx.student.create({
        data: {
          user_id: newUser.id,
          student_id,
          program,
          year: year ? year.toString() : "1",
          section,
          gpa: gpa ? parseFloat(gpa) : 0,
        },
        include: {
          user: true,
        },
      })

      return student
    })

    return NextResponse.json({ student: newStudent }, { status: 201 })
  } catch (error) {
    console.error("Create student error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
