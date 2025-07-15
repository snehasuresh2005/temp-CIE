import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const faculty = await prisma.faculty.findMany({
      include: {
        user: true,
      },
    })

    // Map database fields to frontend-friendly camelCase names
    const facultyWithPhoto = faculty.map(f => {
      return {
        id: f.id,
        userId: f.user_id,
        department: f.department,
        office: f.office,
        specialization: f.specialization,
        facultyId: f.faculty_id, // Use faculty_id from the correct field
        officeHours: f.office_hours,
        user: f.user,
        profilePhotoUrl: `/profile-img/${f.faculty_id}`, // Use faculty_id for image URL
      }
    })
 
    return NextResponse.json({ faculty: facultyWithPhoto })
  } catch (error) {
    console.error("Get faculty error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      password,
      phone,
      department,
      office,
      specialization,
      facultyId,
      officeHours,
    } = body

    // Validate required fields
    if (!name || !email || !password || !department || !office || !specialization || !facultyId || !officeHours) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    // Check if faculty ID already exists
    const existingFaculty = await prisma.faculty.findUnique({
      where: { faculty_id: facultyId }, // Use faculty_id for database query
    })

    if (existingFaculty) {
      return NextResponse.json({ error: "Faculty ID already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user and faculty in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone: phone || null,
          role: "FACULTY",
        },
      })

      // Create faculty
      const faculty = await tx.faculty.create({
        data: {
          department,
          office,
          specialization,
          faculty_id: facultyId, // Store facultyId in faculty_id field (correct field name)
          office_hours: officeHours,
          user_id: user.id,
        },
        include: {
          user: true,
        },
      })

      return faculty
    })

    return NextResponse.json({ 
      faculty: {
        ...result,
        facultyId: result.faculty_id, // Return faculty_id
        officeHours: result.office_hours,
        profilePhotoUrl: `/profile-img/${result.faculty_id}`,
      }
    }, { status: 201 })

  } catch (error) {
    console.error("Create faculty error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      email,
      phone,
      department,
      office,
      specialization,
      facultyId,
      officeHours,
      user
    } = body;

    // Validate required fields
    if (!id || !name || !email || !department || !facultyId || !officeHours) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Update user
    await prisma.user.update({
      where: { id: user?.id },
      data: {
        name,
        email,
        phone: phone || null,
      },
    });

    // Update faculty
    const updatedFaculty = await prisma.faculty.update({
      where: { id },
      data: {
        department,
        office,
        specialization,
        faculty_id: facultyId,
        office_hours: officeHours,
      },
      include: { user: true },
    });

    return NextResponse.json({
      faculty: {
        ...updatedFaculty,
        facultyId: updatedFaculty.faculty_id,
        officeHours: updatedFaculty.office_hours,
        profilePhotoUrl: `/profile-img/${updatedFaculty.faculty_id}`,
      }
    });
  } catch (error) {
    console.error("Update faculty error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing faculty id" }, { status: 400 });
    }

    // Find faculty to get user_id
    const faculty = await prisma.faculty.findUnique({ where: { id } });
    if (!faculty) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    // Delete the user (cascades to faculty if set up, or delete faculty first)
    await prisma.user.delete({ where: { id: faculty.user_id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete faculty error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
