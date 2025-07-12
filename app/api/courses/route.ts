import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserById } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const courses = await prisma.course.findMany({
      include: {
        enrollments: {
          include: {
            student: {
              include: {
                user: {
                  select: { name: true, email: true }
                }
              }
            }
          }
        },
        course_units: {
          orderBy: {
            unit_number: "asc"
          }
        }
      },
      orderBy: {
        created_date: "desc"
      }
    })

    // Get unique user IDs from all courses
    const userIds = [...new Set(courses.map(course => course.created_by))]
    
    // Fetch user information for all creators
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    // Create a map of user ID to user info
    const userMap = new Map(users.map(user => [user.id, user]))

    // Add creator information to each course
    const coursesWithCreators = courses.map(course => ({
      ...course,
      creator: userMap.get(course.created_by) || { name: 'Unknown User', email: 'unknown@example.com' }
    }))

    return NextResponse.json({ courses: coursesWithCreators })
  } catch (error) {
    console.error("Get courses error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from header
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }
    const user = await getUserById(userId)
    if (!user || (user.role !== "FACULTY" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Access denied - Faculty or Admin only" }, { status: 403 })
    }

    const data = await request.json()

    // Validate required fields
    if (!data.course_code || !data.course_name || !data.course_description || !data.course_start_date || !data.course_end_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check uniqueness of course_code
    const existing = await prisma.course.findUnique({ where: { course_code: data.course_code } })
    if (existing) {
      return NextResponse.json({ error: "Course code already exists" }, { status: 409 })
    }

    // Create course with transaction to handle course units
    const result = await prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: {
          course_code: data.course_code,
          course_name: data.course_name,
          course_description: data.course_description,
          course_start_date: new Date(data.course_start_date),
          course_end_date: new Date(data.course_end_date),
          course_enrollments: [],
          created_by: userId,
        }
      })

      // Create course units if provided
      if (data.course_units && Array.isArray(data.course_units)) {
        for (const unit of data.course_units) {
          await tx.courseUnit.create({
            data: {
              course_id: course.id,
              unit_number: unit.unit_number,
              unit_name: unit.unit_name,
              unit_description: unit.unit_description,
              assignment_count: unit.assignment_count || 0,
              hours_per_unit: unit.hours_per_unit || 1,
              created_by: userId,
            }
          })
        }
      }

      return course
    })

    // Fetch the created course with all related data
    const course = await prisma.course.findUnique({
      where: { id: result.id },
      include: {
        enrollments: {
          include: {
            student: {
              include: {
                user: {
                  select: { name: true, email: true }
                }
              }
            }
          }
        },
        course_units: {
          orderBy: {
            unit_number: "asc"
          }
        }
      }
    })

    // Get creator information
    const creator = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    })

    const courseWithCreator = {
      ...course,
      creator: creator || { name: 'Unknown User', email: 'unknown@example.com' }
    }

    return NextResponse.json({ course: courseWithCreator })
  } catch (error) {
    console.error("Create course error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get user from header
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user || (user.role !== "FACULTY" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Access denied - Faculty or Admin only" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("id")

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
    }

    // Check if user can delete this course (admin and faculty can delete any course)
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Both admin and faculty can delete any course
    // No additional permission check needed

    // Delete related data first
    await prisma.enrollment.deleteMany({
      where: { course_id: courseId }
    })

    await prisma.project.deleteMany({
      where: { course_id: courseId }
    })

    await prisma.classSchedule.deleteMany({
      where: { course_id: courseId }
    })

    // Delete the course
    await prisma.course.delete({
      where: { id: courseId }
    })

    return NextResponse.json({ message: "Course deleted successfully" })
  } catch (error) {
    console.error("Delete course error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get user from header
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const user = await getUserById(userId)
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json({ error: "Access denied - Students only" }, { status: 403 })
    }

    const data = await request.json()
    const { courseId, action } = data
    if (!courseId || action !== "enroll") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    // Find the course
    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Check if already enrolled
    if (course.course_enrollments.includes(userId)) {
      return NextResponse.json({ error: "Already enrolled in this course" }, { status: 400 })
    }

    // Add user to course_enrollments
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        course_enrollments: {
          set: [...course.course_enrollments, userId]
        },
        modified_by: userId,
      },
    })

    return NextResponse.json({ course: updatedCourse })
  } catch (error) {
    console.error("Enroll in course error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }
    const user = await getUserById(userId)
    if (!user || (user.role !== "FACULTY" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Access denied - Faculty or Admin only" }, { status: 403 })
    }
    const data = await request.json()
    const { id, course_code, course_name, course_description, course_start_date, course_end_date, course_units } = data
    if (!id) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
    }
    // Find the course
    const course = await prisma.course.findUnique({ where: { id } })
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }
    // Only admin or the creator can update
    if (user.role === "FACULTY" && course.created_by !== userId) {
      return NextResponse.json({ error: "Access denied - You can only edit courses you created" }, { status: 403 })
    }
    // If course_code is being changed, check uniqueness
    if (course_code && course_code !== course.course_code) {
      const existing = await prisma.course.findUnique({ where: { course_code } })
      if (existing) {
        return NextResponse.json({ error: "Course code already exists" }, { status: 409 })
      }
    }
    // Update course and units in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      const updatedCourse = await tx.course.update({
        where: { id },
        data: {
          course_code,
          course_name,
          course_description,
          course_start_date: course_start_date ? new Date(course_start_date) : undefined,
          course_end_date: course_end_date ? new Date(course_end_date) : undefined,
          modified_by: userId,
        },
      })
      // Replace course units if provided
      if (Array.isArray(course_units)) {
        await tx.courseUnit.deleteMany({ where: { course_id: id } })
        for (const unit of course_units) {
          await tx.courseUnit.create({
            data: {
              course_id: id,
              unit_number: unit.unit_number,
              unit_name: unit.unit_name,
              unit_description: unit.unit_description,
              assignment_count: unit.assignment_count || 0,
              hours_per_unit: unit.hours_per_unit || 1,
              created_by: userId,
            },
          })
        }
      }
      return updatedCourse
    })
    // Fetch the updated course with all related data
    const updatedFull = await prisma.course.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: {
            student: {
              include: {
                user: {
                  select: { name: true, email: true }
                }
              }
            }
          }
        },
        course_units: {
          orderBy: {
            unit_number: "asc"
          }
        }
      }
    })
    if (!updatedFull) {
      return NextResponse.json({ error: "Failed to fetch updated course" }, { status: 500 })
    }

    // Get creator information
    const creator = await prisma.user.findUnique({
      where: { id: updatedFull.created_by },
      select: { id: true, name: true, email: true }
    })
    const courseWithCreator = {
      ...updatedFull,
      creator: creator || { name: 'Unknown User', email: 'unknown@example.com' }
    }
    return NextResponse.json({ course: courseWithCreator })
  } catch (error) {
    console.error("Update course error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
