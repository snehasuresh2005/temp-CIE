import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/course-units - Get all course units or filter by course_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    let whereClause = {}
    if (courseId) {
      whereClause = { course_id: courseId }
    }

    const courseUnits = await prisma.courseUnit.findMany({
      where: whereClause,
      include: {
        course: {
          select: {
            course_name: true,
            course_description: true
          }
        }
      },
      orderBy: [
        { course_id: "asc" },
        { unit_number: "asc" }
      ]
    })

    return NextResponse.json({ courseUnits })
  } catch (error) {
    console.error("Error fetching course units:", error)
    return NextResponse.json(
      { error: "Failed to fetch course units" },
      { status: 500 }
    )
  }
}

// POST /api/course-units - Create a new course unit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const {
      course_id,
      unit_number,
      unit_name,
      unit_description,
      assignment_count = 0,
      hours_per_unit = 1
    } = body

    // Validate required fields
    if (!course_id || !unit_number || !unit_name || !unit_description) {
      return NextResponse.json(
        { error: "Missing required fields: course_id, unit_number, unit_name, unit_description" },
        { status: 400 }
      )
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: course_id }
    })

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      )
    }

    // Check if unit number already exists for this course
    const existingUnit = await prisma.courseUnit.findUnique({
      where: {
        course_id_unit_number: {
          course_id,
          unit_number
        }
      }
    })

    if (existingUnit) {
      return NextResponse.json(
        { error: "Unit number already exists for this course" },
        { status: 409 }
      )
    }

    // Create the course unit
    const courseUnit = await prisma.courseUnit.create({
      data: {
        course_id,
        unit_number,
        unit_name,
        unit_description,
        assignment_count,
        hours_per_unit,
        created_by: userId,
        modified_by: userId
      },
      include: {
        course: {
          select: {
            course_name: true,
            course_description: true
          }
        }
      }
    })

    return NextResponse.json({ courseUnit }, { status: 201 })
  } catch (error) {
    console.error("Error creating course unit:", error)
    return NextResponse.json(
      { error: "Failed to create course unit" },
      { status: 500 }
    )
  }
}

// PUT /api/course-units - Update a course unit
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = request.headers.get("x-user-id")
    const { searchParams } = new URL(request.url)
    const unitId = searchParams.get("id")

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (!unitId) {
      return NextResponse.json({ error: "Unit ID is required" }, { status: 400 })
    }

    const {
      unit_number,
      unit_name,
      unit_description,
      assignment_count,
      hours_per_unit
    } = body

    // Check if unit exists
    const existingUnit = await prisma.courseUnit.findUnique({
      where: { id: unitId }
    })

    if (!existingUnit) {
      return NextResponse.json(
        { error: "Course unit not found" },
        { status: 404 }
      )
    }

    // If unit_number is being changed, check for conflicts
    if (unit_number && unit_number !== existingUnit.unit_number) {
      const conflictingUnit = await prisma.courseUnit.findUnique({
        where: {
          course_id_unit_number: {
            course_id: existingUnit.course_id,
            unit_number
          }
        }
      })

      if (conflictingUnit) {
        return NextResponse.json(
          { error: "Unit number already exists for this course" },
          { status: 409 }
        )
      }
    }

    // Update the course unit
    const updatedUnit = await prisma.courseUnit.update({
      where: { id: unitId },
      data: {
        unit_number: unit_number || existingUnit.unit_number,
        unit_name: unit_name || existingUnit.unit_name,
        unit_description: unit_description || existingUnit.unit_description,
        assignment_count: assignment_count !== undefined ? assignment_count : existingUnit.assignment_count,
        hours_per_unit: hours_per_unit !== undefined ? hours_per_unit : existingUnit.hours_per_unit,
        modified_by: userId
      },
      include: {
        course: {
          select: {
            course_name: true,
            course_description: true
          }
        }
      }
    })

    return NextResponse.json({ courseUnit: updatedUnit })
  } catch (error) {
    console.error("Error updating course unit:", error)
    return NextResponse.json(
      { error: "Failed to update course unit" },
      { status: 500 }
    )
  }
}

// DELETE /api/course-units - Delete a course unit
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    const { searchParams } = new URL(request.url)
    const unitId = searchParams.get("id")

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (!unitId) {
      return NextResponse.json({ error: "Unit ID is required" }, { status: 400 })
    }

    // Check if unit exists
    const existingUnit = await prisma.courseUnit.findUnique({
      where: { id: unitId }
    })

    if (!existingUnit) {
      return NextResponse.json(
        { error: "Course unit not found" },
        { status: 404 }
      )
    }

    // Delete the course unit
    await prisma.courseUnit.delete({
      where: { id: unitId }
    })

    return NextResponse.json({ message: "Course unit deleted successfully" })
  } catch (error) {
    console.error("Error deleting course unit:", error)
    return NextResponse.json(
      { error: "Failed to delete course unit" },
      { status: 500 }
    )
  }
} 