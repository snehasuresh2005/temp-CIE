import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Verify user is faculty
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { faculty: {
        include: { domain_assignments: true }
      } }
    })

    if (!user?.faculty) {
      return NextResponse.json({ error: "Faculty access required" }, { status: 403 })
    }

    // Determine coordinator status
    const isCoordinator = user.faculty.domain_assignments && user.faculty.domain_assignments.length > 0
    let pendingRequests = 0
    let activeRequests = 0

    if (isCoordinator) {
      // Get all domain IDs this faculty coordinates
      const domainIds = user.faculty.domain_assignments.map((a: any) => a.domain_id)
      // Count pending component requests for these domains
      const pendingComponentRequests = await prisma.componentRequest.count({
        where: {
          status: "PENDING",
          component: {
            domain_id: { in: domainIds }
          }
        }
      })
      // Count pending library requests for these domains
      const pendingLibraryRequests = await prisma.libraryRequest.count({
        where: {
          status: "PENDING",
          item: {
            domain_id: { in: domainIds }
          }
        }
      })
      pendingRequests = pendingComponentRequests + pendingLibraryRequests
    } else {
      // For non-coordinators, count active requests assigned to this faculty
      const activeComponentRequests = await prisma.componentRequest.count({
        where: {
          status: "PENDING",
          approved_by: user.faculty.id
        }
      })
      const activeLibraryRequests = await prisma.libraryRequest.count({
        where: {
          status: "PENDING",
          faculty_id: user.faculty.id
        }
      })
      activeRequests = activeComponentRequests + activeLibraryRequests
    }

    // Get basic statistics and courses data
    const [
      coursesCount,
      studentsCount,
      courses
    ] = await Promise.all([
      // Count courses created by this faculty OR courses they teach via class schedules
      prisma.course.count({ 
        where: { 
          OR: [
            { created_by: userId },
            { class_schedules: { some: { faculty_id: user.faculty.id } } }
          ]
        } 
      }),
      // Get courses to count students from both enrollments table and course_enrollments array
      prisma.course.findMany({
        where: { 
          OR: [
            { created_by: userId },
            { class_schedules: { some: { faculty_id: user.faculty.id } } }
          ]
        },
        select: {
          course_enrollments: true,
          enrollments: {
            select: { student_id: true }
          }
        }
      }),
      // Get courses created by this faculty OR courses they teach via class schedules
      prisma.course.findMany({
          where: { 
            OR: [
              { created_by: userId },
              { class_schedules: { some: { faculty_id: user.faculty.id } } }
            ]
          },
          include: {
            enrollments: {
              include: {
                student: {
                  include: {
                    user: {
                      select: { name: true }
                    }
                  }
                }
              }
            }
          },
          orderBy: { course_start_date: 'desc' }
        })
    ])

    // Calculate total students from both enrollments table and course_enrollments array
    const studentsFromEnrollments = coursesCount > 0 ? studentsCount.reduce((total, course) => {
      return total + course.enrollments.length
    }, 0) : 0
    
    const studentsFromArray = coursesCount > 0 ? studentsCount.reduce((total, course) => {
      return total + (course.course_enrollments?.length || 0)
    }, 0) : 0
    
    const totalStudents = studentsFromEnrollments + studentsFromArray

    const stats = {
      courses: coursesCount,
      students: totalStudents,
      pendingRequests,
      activeRequests,
      upcomingBookings: 0
    }

    const alerts = [
      {
        type: 'system_status',
        message: 'System healthy - 99.9% uptime',
        priority: 'info',
        color: 'green'
      }
    ]

    // Get recent activities for faculty
    const [
      recentEnrollments,
      recentComponentApprovals,
      recentLibraryApprovals,
      recentProjectRequests,
      recentLocationBookings
    ] = await Promise.all([
      // Recent enrollments in faculty's courses
      prisma.enrollment.findMany({
        take: 5,
        where: {
          OR: [
            { course: { created_by: userId } },
            { course: { class_schedules: { some: { faculty_id: user.faculty.id } } } }
          ]
        },
        orderBy: { enrolled_at: 'desc' },
        include: {
          student: {
            include: {
              user: {
                select: { name: true }
              }
            }
          },
          course: {
            select: { course_name: true, course_code: true }
          }
        }
      }),
      // Recent component requests approved by this faculty
      prisma.componentRequest.findMany({
        take: 5,
        where: {
          approved_by: user.faculty.id
        },
        orderBy: { approved_date: 'desc' },
        include: {
          student: {
            include: {
              user: {
                select: { name: true }
              }
            }
          },
          component: {
            select: { component_name: true }
          }
        }
      }),
      // Recent library requests approved by this faculty
      prisma.libraryRequest.findMany({
        take: 5,
        where: {
          faculty_id: user.faculty.id
        },
        orderBy: { request_date: 'desc' },
        include: {
          student: {
            include: {
              user: {
                select: { name: true }
              }
            }
          },
          item: {
            select: { item_name: true }
          }
        }
      }),
      // Recent project requests assigned to this faculty
      prisma.projectRequest.findMany({
        take: 5,
        where: {
          faculty_id: user.faculty.id
        },
        orderBy: { request_date: 'desc' },
        include: {
          student: {
            include: {
              user: {
                select: { name: true }
              }
            }
          },
          project: {
            select: { name: true }
          }
        }
      }),
      // Recent location bookings by this faculty
      prisma.locationBooking.findMany({
        take: 5,
        where: {
          faculty_id: user.faculty.id
        },
        orderBy: { created_at: 'desc' },
        include: {
          location: {
            select: { name: true }
          }
        }
      })
    ])

    // Combine and sort all activities by date
    const allActivities = [
      ...recentEnrollments.map(enrollment => ({
        type: 'enrollment',
        message: `${enrollment.student?.user?.name || 'Unknown'} enrolled in your course "${enrollment.course?.course_name || 'Unknown Course'}"`,
        time: enrollment.enrolled_at,
        user: enrollment.student?.user?.name || 'Unknown',
        category: 'enrollment',
        status: 'ENROLLED'
      })),
      ...recentComponentApprovals.map(request => ({
        type: 'component_approval',
        message: `You approved lab component request for "${request.component?.component_name || 'Unknown'}" by ${request.student?.user?.name || 'Unknown'}`,
        time: request.approved_date || request.request_date,
        user: request.student?.user?.name || 'Unknown',
        category: 'component_approval',
        status: request.status
      })),
      ...recentLibraryApprovals.map(request => ({
        type: 'library_approval',
        message: `Library request for "${request.item?.item_name || 'Unknown'}" by ${request.student?.user?.name || 'Unknown'}`,
        time: request.request_date,
        user: request.student?.user?.name || 'Unknown',
        category: 'library_approval',
        status: request.status
      })),
      ...recentProjectRequests.map(request => ({
        type: 'project_request',
        message: `${request.student?.user?.name || 'Unknown'} requested project "${request.project?.name || 'Unknown'}"`,
        time: request.request_date,
        user: request.student?.user?.name || 'Unknown',
        category: 'project_request',
        status: request.status
      })),
      ...recentLocationBookings.map(booking => ({
        type: 'location_booking',
        message: `You booked location "${booking.location?.name || 'Unknown'}" for ${booking.title}`,
        time: booking.created_at,
        user: user.name,
        category: 'location_booking',
        status: 'BOOKED'
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10)

    const activities = allActivities.length > 0 ? allActivities : [
      {
        type: 'system',
        message: 'System initialized successfully',
        time: new Date(),
        user: 'System',
        category: 'system'
      }
    ]

    return NextResponse.json({
      stats,
      alerts,
      activities,
      courses,
      isCoordinator
    })
  } catch (error) {
    console.error("Faculty dashboard error:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}