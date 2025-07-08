import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const professors = await prisma.professor.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    });

    return NextResponse.json({ professors });
  } catch (error) {
    console.error("Error fetching professors:", error);
    return NextResponse.json({ error: "Failed to fetch professors" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      user_id, 
      professor_id, 
      department, 
      office, 
      specialization, 
      office_hours 
    } = body;

    if (!user_id || !professor_id || !department || !office || !specialization || !office_hours) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if professor_id already exists
    const existingProfessor = await prisma.professor.findUnique({
      where: { professor_id }
    });

    if (existingProfessor) {
      return NextResponse.json({ error: "Professor ID already exists" }, { status: 400 });
    }

    // Check if user_id already has a professor profile
    const existingUserProfessor = await prisma.professor.findUnique({
      where: { user_id }
    });

    if (existingUserProfessor) {
      return NextResponse.json({ error: "User already has a professor profile" }, { status: 400 });
    }

    const professor = await prisma.professor.create({
      data: {
        user_id,
        professor_id,
        department,
        office,
        specialization,
        office_hours,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    });

    return NextResponse.json({ professor }, { status: 201 });
  } catch (error) {
    console.error("Error creating professor:", error);
    return NextResponse.json({ error: "Failed to create professor" }, { status: 500 });
  }
}