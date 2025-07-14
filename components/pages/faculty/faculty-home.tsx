"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { Users, BookOpen, ClipboardCheck, Clock, AlertTriangle, CheckCircle, Calendar, MapPin, FolderOpen } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { ManageCourses } from "@/components/pages/admin/manage-courses"

interface FacultyHomeProps {
  onPageChange?: (page: string) => void
}

export function FacultyHome({ onPageChange }: FacultyHomeProps) {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const [highlightQuickActions, setHighlightQuickActions] = useState(false);
  const handleQuickActionsClick = () => {
    quickActionsRef.current?.scrollIntoView({ behavior: 'smooth' });
    setHighlightQuickActions(true);
    setTimeout(() => setHighlightQuickActions(false), 1000);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return
      
      setLoading(true)
      try {
        const response = await fetch('/api/dashboard/faculty', {
          headers: {
            'x-user-id': user.id
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setDashboardData(data)
          setCourses(data.courses || [])
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        setCourses([])
        setDashboardData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user?.id])

  const stats = dashboardData ? [
    {
      title: "Courses",
      value: (dashboardData.stats.courses || 0).toString(),
      description: "created courses",
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      title: "Students",
      value: (dashboardData.stats.students || 0).toString(),
      description: "Enrolled to your course",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Requests",
      value: (dashboardData.stats.pendingRequests || 0).toString(),
      description: "Pending approvals",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Attendance Rate",
      value: `${dashboardData.stats.attendanceRate || 0}%`,
      description: "This semester",
      icon: ClipboardCheck,
      color: "text-purple-600",
    },
    {
      title: "Bookings",
      value: (dashboardData.stats.upcomingBookings || 0).toString(),
      description: "Upcoming bookings",
      icon: CheckCircle,
      color: "text-pink-600",
    },
    {
      title: "Avg Grade(*)",
      value: (dashboardData.stats.avgGradeThisSem || "N/A").toString(),
      description: "This semester",
      icon: AlertTriangle,
      color: "text-yellow-600",
    },
  ] : []


  const quickActions = [
    {
      title: "CIE Coordinator",
      description: "Manage coordinator tasks",
      action: () => onPageChange?.("coordinator"),
      icon: Users,
    },
    {
      title: "Assign Project",
      description: "Create new student project",
      action: () => onPageChange?.("projects"),
      icon: FolderOpen,
    },
    {
      title: "Book Location",
      description: "Reserve a classroom or lab",
      action: () => onPageChange?.("locations"),
      icon: MapPin,
    },
  ]

  return (
    <div className="space-y-6">
      {(() => {
        return (
          <>
            {/* Colorful Hero Window */}
            <div className="rounded-3xl shadow-2xl bg-gradient-to-br from-[#0056a6] via-[#00b6e3] to-[#ff7f32] p-12 min-h-[320px] flex flex-col md:flex-row items-center justify-between mb-4 relative overflow-hidden">
              <div className="flex-1 z-10">
                <div className="flex items-center mb-6">
                  <span className="bg-white rounded-xl p-2 shadow mr-6 flex items-center justify-center"><img src="/logo.png" alt="CIE Logo" className="h-16 w-auto" /></span>
                  <span className="text-white text-4xl font-extrabold tracking-tight">CIE Faculty Portal</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">Empower your teaching journey!</h2>
                <p className="text-white/90 mb-8 max-w-2xl text-lg">Access your courses, manage students, and track progress—all in one place.</p>
                <div className="flex gap-6">
                  <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-lg shadow transition-colors text-lg">Learn More</button>
                  <button className="bg-white hover:bg-gray-100 text-blue-700 font-semibold px-8 py-3 rounded-lg shadow transition-colors text-lg" onClick={handleQuickActionsClick}>Quick Actions</button>
                </div>
              </div>
              <img src="/logo.png" alt="CIE Watermark" className="absolute right-10 bottom-0 opacity-10 h-64 w-auto hidden md:block select-none pointer-events-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow animate-pulse">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 w-4 bg-gray-200 rounded"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                // Remove Attendance Rate card and insert Pending/Active Requests card in its place
                stats
                  .filter((stat) => stat.title !== "Attendance Rate")
                  .map((stat, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow transform hover:scale-105 focus:scale-105 transition-transform duration-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">{stat.description}</p>
                      </CardContent>
                    </Card>
                  ))
              )}
              {/* Insert Pending/Active Requests card in the grid */}
              {!loading && dashboardData && (
                <Card className="hover:shadow-lg transition-shadow transform hover:scale-105 focus:scale-105 transition-transform duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {dashboardData.isCoordinator ? "Pending Requests(*)" : "Active Requests"}
                    </CardTitle>
                    {dashboardData.isCoordinator ? (
                      <Clock className="h-4 w-4 text-orange-600" />
                    ) : (
                      <ClipboardCheck className="h-4 w-4 text-blue-600" />
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboardData.isCoordinator
                        ? dashboardData.stats.pendingRequests
                        : dashboardData.stats.activeRequests}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {dashboardData.isCoordinator ? "awaiting approval" : "assigned to you"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Today's Schedule */}
            {dashboardData?.calendar?.upcomingClasses?.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Today's Classes</span>
                  </CardTitle>
                  <CardDescription>Your scheduled classes for today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dashboardData.calendar.upcomingClasses.map((classItem: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-lg">{classItem.courseCode}</h3>
                          <span className="text-sm text-gray-500">{classItem.startTime} - {classItem.endTime}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{classItem.courseName}</p>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>{classItem.location}</span>
                          <span>{classItem.enrolledStudents} students</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="transform hover:scale-105 focus:scale-105 transition-transform duration-200">
                <CardHeader>
                  <CardTitle>Courses</CardTitle>
                  <CardDescription>Your created courses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loading ? (
                      <p className="text-gray-500 text-center py-4">Loading...</p>
                    ) : courses.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No courses created</p>
                    ) : (
                      courses.slice(0, 3).map((course: any) => (
                        <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h3 className="font-medium text-lg">{course.course_name}</h3>
                            <p className="text-sm text-gray-500">{course.course_code}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{course.course_enrollments?.length || 0} students</p>
                            <p className="text-xs text-gray-500">
                              {course.course_start_date ? new Date(course.course_start_date).toLocaleDateString() : ''}
                              {course.course_end_date ? ` - ${new Date(course.course_end_date).toLocaleDateString()}` : ''}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="transform hover:scale-105 focus:scale-105 transition-transform duration-200">
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>Latest updates and notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loading ? (
                      Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="flex items-center space-x-4 animate-pulse">
                          <div className="h-4 w-4 bg-gray-200 rounded"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-48"></div>
                            <div className="h-3 bg-gray-200 rounded w-32"></div>
                          </div>
                        </div>
                      ))
                    ) : dashboardData?.activities?.length > 0 ? (
                      dashboardData.activities.slice(0, 4).map((activity: any, index: number) => {
                        const iconColors = ['text-orange-600', 'text-green-600', 'text-red-600', 'text-blue-600', 'text-purple-600', 'text-indigo-600']
                        const iconColor = iconColors[index % iconColors.length]
                        const timeAgo = new Date(activity.time).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })
                        const IconComponent = activity.category === 'laboratory' ? Clock :
                                            activity.category === 'locations' ? BookOpen :
                                            activity.category === 'academics' ? ClipboardCheck :
                                            CheckCircle
                        return (
                          <div key={index} className="flex items-center space-x-4">
                            <IconComponent className={`h-4 w-4 ${iconColor}`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{activity.message}</p>
                              <div className="flex items-center space-x-2">
                                <p className="text-xs text-gray-500">{timeAgo}</p>
                                {activity.status && (
                                  <>
                                    <span className="text-xs text-gray-300">•</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      activity.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                      activity.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                      activity.status === 'COLLECTED' ? 'bg-blue-100 text-blue-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {activity.status}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No recent activities</p>
                        <p className="text-xs mt-1">Activities will appear here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card
                ref={quickActionsRef}
                className={`transform transition-transform duration-300 hover:scale-105 focus:scale-105 ${highlightQuickActions ? 'scale-110 ring-4 ring-blue-400/60 z-20' : ''}`}
              >
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common faculty tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {quickActions.map((action, idx) => (
                      <button 
                        key={idx} 
                        onClick={action.action}
                        className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium">{action.title}</div>
                        <div className="text-sm text-gray-500">{action.description}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        );
      })()}
    </div>
  )
}
