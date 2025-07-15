import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Verify user is student
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: true }
    })



    if (!user?.student) {
      return NextResponse.json({ error: "Student access required" }, { status: 403 })
    }

    // DEBUG: Fetch and log all enrollments for this student
    const allEnrollments = await prisma.enrollment.findMany({
      where: { student_id: user.student.id },
      include: { course: { select: { id: true, course_name: true } } }
    })
    console.log('DEBUG: All enrollments for student', user.student.id, allEnrollments)

    // Remove enrolled courses count logic
    // (delete enrolledCoursesCount, and remove from stats)

    // Get basic statistics
    const [
      activeProjectsCount,
      attendanceRecords
    ] = await Promise.all([
      prisma.projectRequest.count({ where: { student_id: user.student.id, status: { in: ['PENDING', 'APPROVED'] } } }),
      prisma.studentAttendance.findMany({ 
        where: { student_id: user.student.id },
        select: { status: true }
      })
    ])

    // Calculate attendance rate only if records exist
    let attendanceRate = null
    if (attendanceRecords.length > 0) {
      const presentCount = attendanceRecords.filter(record => record.status === 'PRESENT').length
      attendanceRate = Math.round((presentCount / attendanceRecords.length) * 100)
    }

    const stats = {
      activeProjects: activeProjectsCount,
      attendanceRate: attendanceRate,
      borrowedItems: 0
    }

    const alerts = [
      {
        type: 'system_status',
        message: 'System healthy - 99.9% uptime',
        priority: 'info',
        color: 'green'
      }
    ]

    // Get recent activities for student
    const [
      recentEnrollments,
      recentComponentRequests,
      recentLibraryRequests,
      recentProjectRequests,
      recentProjectSubmissions
    ] = await Promise.all([
      // Recent course enrollments by this student
      prisma.enrollment.findMany({
        take: 5,
        where: {
          student_id: user.student.id
        },
        orderBy: { enrolled_at: 'desc' },
        include: {
          course: {
            select: { course_name: true, course_code: true }
          }
        }
      }),
      // Recent component requests by this student
      prisma.componentRequest.findMany({
        take: 5,
        where: {
          student_id: user.student.id
        },
        orderBy: { request_date: 'desc' },
        include: { 
          component: {
            select: { component_name: true }
          }
        }
        }),
      // Recent library requests by this student
        prisma.libraryRequest.findMany({
        take: 5,
        where: {
          student_id: user.student.id
          },
        orderBy: { request_date: 'desc' },
        include: {
          item: {
            select: { item_name: true }
          }
        }
      }),
      // Recent project requests by this student
      prisma.projectRequest.findMany({
        take: 5,
        where: {
          student_id: user.student.id
        },
        orderBy: { request_date: 'desc' },
        include: { 
          project: {
            select: { name: true }
          }
        }
      }),
      // Recent project submissions by this student
      prisma.projectSubmission.findMany({
        take: 5,
          where: {
          student_id: user.student.id
        },
        orderBy: { submission_date: 'desc' },
        include: {
          project: {
            select: { name: true }
          }
        }
        })
    ])

    // Combine and sort all activities by date
    const allActivities = [
      ...recentEnrollments.map(enrollment => ({
        type: 'enrollment',
        message: `You enrolled in "${enrollment.course?.course_name || 'Unknown Course'}"`,
        time: enrollment.enrolled_at,
        user: user.name,
        category: 'enrollment',
        status: 'ENROLLED'
      })),
      ...recentComponentRequests.map(request => ({
        type: 'component_request',
        message: `You requested lab component "${request.component?.component_name || 'Unknown'}"`,
        time: request.request_date,
        user: user.name,
        category: 'component_request',
        status: request.status
      })),
      ...recentLibraryRequests.map(request => ({
        type: 'library_request',
        message: `You requested library item "${request.item?.item_name || 'Unknown'}"`,
        time: request.request_date,
        user: user.name,
        category: 'library_request',
        status: request.status
      })),
      ...recentProjectRequests.map(request => ({
        type: 'project_request',
        message: `You requested project "${request.project?.name || 'Unknown'}"`,
        time: request.request_date,
        user: user.name,
        category: 'project_request',
        status: request.status
      })),
      ...recentProjectSubmissions.map(submission => ({
        type: 'project_submission',
        message: `You submitted project "${submission.project?.name || 'Unknown'}"`,
        time: submission.submission_date,
        user: user.name,
        category: 'project_submission',
        status: submission.status
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

    // Fetch up to 20 project requests for this student (all statuses)
    const studentProjectRequests = await prisma.projectRequest.findMany({
      where: { student_id: user.student.id },
      orderBy: { request_date: 'desc' },
      take: 20,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            expected_completion_date: true,
            status: true,
            // Add more fields if needed
          }
        }
      }
    })

    // Map to frontend-friendly format, filter for ONGOING
    const activeProjects = studentProjectRequests
      .filter(pr => pr.project && pr.project.status === 'ONGOING')
      .slice(0, 4)
      .map(pr => ({
        id: pr.project.id,
        title: pr.project.name,
        description: pr.project.description,
        status: pr.project.status,
        deadline: pr.project.expected_completion_date,
        // Add more fields if needed
      }))

    return NextResponse.json({
      stats,
      alerts,
      activities,
      activeProjects
    })
  } catch (error) {
    console.error("Student dashboard error:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}