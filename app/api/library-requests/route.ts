import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserById } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let student_id = searchParams.get("student_id");
  let faculty_id = searchParams.get("faculty_id");

  let where: any = {};
  // If student_id is actually a user_id, resolve to real student id
  if (student_id) {
    const studentRecord = await prisma.student.findFirst({ where: { OR: [{ id: student_id }, { user_id: student_id }] } })
    if (studentRecord) student_id = studentRecord.id
  }
  if (student_id) where.student_id = student_id;
  
  // Resolve faculty_id if a user_id is supplied
  if (faculty_id) {
    const facultyRecord = await prisma.faculty.findFirst({ where: { OR: [{ id: faculty_id }, { user_id: faculty_id }] } });
    if (facultyRecord) faculty_id = facultyRecord.id;
  }
  if (faculty_id) where.faculty_id = faculty_id;

  const requests = await prisma.libraryRequest.findMany({
    where,
    orderBy: { request_date: "desc" },
    include: {
      item: true,
      student: {
        include: { user: true },
      },
      faculty: {
        include: { user: true },
      },
    },
  });
  return NextResponse.json({ requests });
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user || !["STUDENT", "FACULTY"].includes(user.role)) {
      return NextResponse.json({ error: "Access denied - Students and Faculty only" }, { status: 403 })
    }

    const body = await req.json()
    const { item_id, quantity, purpose, required_date } = body

    if (!item_id || !quantity || !purpose || !required_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check item availability
    const item = await prisma.libraryItem.findUnique({
      where: { id: item_id }
    })

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    if (item.available_quantity < quantity) {
      return NextResponse.json({ error: "Insufficient quantity available" }, { status: 400 })
    }

    // Prepare request data based on user role
    const requestData: any = {
      item_id,
      quantity,
      purpose,
      required_date: new Date(required_date),
      request_date: new Date(),
      status: "APPROVED", // Auto-approve for students and faculty
      faculty_notes: "Auto-approved - Ready for collection"
    }

    if (user.role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { user_id: userId }
      })
      if (!student) {
        return NextResponse.json({ error: "Student profile not found" }, { status: 404 })
      }
      requestData.student_id = student.id
    } else if (user.role === "FACULTY") {
      const faculty = await prisma.faculty.findUnique({
        where: { user_id: userId }
      })
      if (!faculty) {
        return NextResponse.json({ error: "Faculty profile not found" }, { status: 404 })
      }
      requestData.faculty_id = faculty.id
      requestData.student_id = null
    }

    // Update item availability first
    await prisma.libraryItem.update({
      where: { id: item_id },
      data: {
        available_quantity: {
          decrement: quantity
        }
      }
    })

    // Create the request
    const request = await prisma.libraryRequest.create({
      data: requestData,
      include: {
        item: true,
        student: {
          include: { user: true }
        },
        faculty: {
          include: { user: true }
        },
      }
    })

    return NextResponse.json({ request })
  } catch (error) {
    console.error("Error creating library request:", error)
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 })
  }
}
