import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // For now, we'll allow access without authentication
    // In a real app, you'd implement proper session checking here

    const searchParams = request.nextUrl.searchParams
    const facultyId = searchParams.get("facultyId")
    const courseId = searchParams.get("courseId")
    const studentId = searchParams.get("studentId")

    let schedules

    if (facultyId) {
      // Get schedules for a specific faculty
      schedules = await prisma.classSchedule.findMany({
        where: { faculty_id: facultyId },
        include: {
          course: true,
          faculty: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      })
    } else if (courseId) {
      // Get schedules for a specific course
      schedules = await prisma.classSchedule.findMany({
        where: { course_id: courseId },
        include: {
          course: true,
          faculty: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      })
    } else if (studentId) {
      // Get schedules for a specific student based on their enrollments
      const studentEnrollments = await prisma.enrollment.findMany({
        where: { student_id: studentId },
        select: { course_id: true },
      });

      const courseIds = studentEnrollments.map((enrollment) => enrollment.course_id);

      schedules = await prisma.classSchedule.findMany({
        where: {
          course_id: {
            in: courseIds,
          },
        },
        include: {
          course: true,
          faculty: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      })
    } else {
      // Get all schedules (admin view)
      schedules = await prisma.classSchedule.findMany({
        include: {
          course: true,
          faculty: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      })
    }

    // Transform all schedules to match frontend interface
    const transformedSchedules = schedules.map(schedule => ({
      id: schedule.id,
      courseId: schedule.course_id,
      facultyId: schedule.faculty_id,
      room: schedule.room,
      dayOfWeek: schedule.day_of_week,
      startTime: schedule.start_time,
      endTime: schedule.end_time,
      section: schedule.section,
      course: {
        course_id: schedule.course.id,
        course_name: schedule.course.course_name,
      },
      faculty: {
        user: {
          name: schedule.faculty?.user.name || "",
          email: schedule.faculty?.user.email || "",
        },
      },
    }));

    return NextResponse.json({ schedules: transformedSchedules })
  } catch (error) {
    console.error("Get class schedules error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Data validation could be added here

    const newSchedule = await prisma.classSchedule.create({
      data: {
        course_id: data.courseId,
        faculty_id: data.facultyId,
        room: data.room,
        day_of_week: data.dayOfWeek,
        start_time: data.startTime,
        end_time: data.endTime,
        section: data.section,
      },
      include: {
        course: true,
        faculty: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Transform the response to match frontend interface
    const transformedSchedule = {
      id: newSchedule.id,
      courseId: newSchedule.course_id,
      facultyId: newSchedule.faculty_id,
      room: newSchedule.room,
      dayOfWeek: newSchedule.day_of_week,
      startTime: newSchedule.start_time,
      endTime: newSchedule.end_time,
      section: newSchedule.section,
      course: {
        course_id: newSchedule.course.id,
        course_name: newSchedule.course.course_name,
      },
      faculty: {
        user: {
          name: newSchedule.faculty?.user.name || "",
          email: newSchedule.faculty?.user.email || "",
        },
      },
    };

    return NextResponse.json({ schedule: transformedSchedule });
  } catch (error) {
    console.error("Create class schedule error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
