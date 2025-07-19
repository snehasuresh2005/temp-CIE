"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { Users, BookOpen, ClipboardCheck, Clock, AlertTriangle, CheckCircle, Calendar, MapPin, FolderOpen } from "lucide-react"

import { TodoList } from "@/components/ui/todo-list"
import { DailyCalendar } from "@/components/ui/daily-calendar"
import { useEffect, useState, useRef } from "react"
import { ManageCourses } from "@/components/pages/admin/manage-courses"
import { useTheme } from "next-themes"

interface FacultyHomeProps {
  onPageChange?: (page: string) => void
}

export function FacultyHome({ onPageChange }: FacultyHomeProps) {
  const { user } = useAuth()
  const { theme } = useTheme();
  const [courses, setCourses] = useState([])
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
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

  return (
    <div className="space-y-6">
      {(() => {
        return (
          <>
            {/* Colorful Hero Window */}
            <div className="rounded-3xl shadow-2xl p-6 min-h-[100px] flex flex-col md:flex-row items-center justify-between mb-0 relative overflow-hidden" style={{ background: "linear-gradient(120deg, #0056a6 0%, #2196f3 30%, #00b6e3 60%, #ffb347 85%, #ff7f32 100%)" }}>
              <div className="flex-1 z-6">
                <div className="flex items-center mb-2 justify-between">
                  <span className="text-white text-3xl font-extrabold tracking-tight">CIE Faculty Portal</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2">Empower your teaching journey!</h2>
                <p className="text-white/90 mb-4 max-w-2xl text-lg whitespace-nowrap">Access your courses, manage students, and track progress—all in one place.</p>
                </div>
              {/* <img src="/logo.png" alt="CIE Watermark" className="absolute right-10 bottom-0 opacity-10 h-64 w-auto hidden md:block select-none pointer-events-none" /> */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-2">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow animate-pulse" style={theme === 'light' ? { background: '#e3f0ff' } : {}}>
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
                    <Card key={index} className="hover:shadow-lg transition-shadow transform hover:scale-105 focus:scale-105 transition-transform duration-200" style={theme === 'light' ? { background: '#e3f0ff' } : {}}>
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
                <Card className="hover:shadow-lg transition-shadow transform hover:scale-105 focus:scale-105 transition-transform duration-200" style={theme === 'light' ? { background: '#e3f0ff' } : {}}>
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

            <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
              <div className="lg:col-span-4">
                <TodoList role="faculty" />
              </div>
              <div className="lg:col-span-6">
                <DailyCalendar role="faculty" />
              </div>
            </div>
          </>
        );
      })()}
    </div>
  )
}
