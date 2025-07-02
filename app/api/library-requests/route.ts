import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    },
  });
  return NextResponse.json({ requests });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.student_id || !body.item_id || !body.quantity || !body.required_date || !body.purpose) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Resolve student_id (accept user.id as alias)
    let studentId: string = body.student_id;
    const studentRecord = await prisma.student.findFirst({
      where: {
        OR: [
          { id: studentId },
          { user_id: studentId },
        ],
      },
    });
    if (!studentRecord) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    studentId = studentRecord.id;

    const item = await prisma.libraryItem.findUnique({ where: { id: body.item_id } });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Check availability
    if (item.available_quantity < body.quantity) {
      return NextResponse.json({ error: "Insufficient quantity available" }, { status: 400 });
    }

    // Determine faculty responsible based on the item
    // Determine faculty responsible based on the item
    let faculty_id: string | null = item.faculty_id ?? null;
    if (!faculty_id && item.created_by) {
      // created_by stores user_id of creator (could be faculty). Try resolve
      const creatorFaculty = await prisma.faculty.findFirst({ where: { user_id: item.created_by } });
      if (creatorFaculty) {
        faculty_id = creatorFaculty.id;
        // Optional: persist for future use
        await prisma.libraryItem.update({ where: { id: item.id }, data: { faculty_id } });
      }
    }

    // Create request
    const request = await prisma.libraryRequest.create({
      data: {
        student_id: studentId,
        item_id: body.item_id,
        quantity: body.quantity,
        purpose: body.purpose,
        required_date: new Date(body.required_date),
        notes: body.notes ?? null,
        faculty_id,
      },
      include: {
      item: true,
      student: {
        include: { user: true },
      },
    },
    });

    // Deduct available quantity
    await prisma.libraryItem.update({
      where: { id: body.item_id },
      data: { available_quantity: { decrement: body.quantity } },
    });

    return NextResponse.json({ request });
  } catch (error) {
    console.error("Error creating library request:", error);
    return NextResponse.json({ error: "Failed to create library request" }, { status: 500 });
  }
}
