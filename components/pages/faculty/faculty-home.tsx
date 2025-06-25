"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { Users, BookOpen, ClipboardCheck, Clock, AlertTriangle, CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { ManageCourses } from "@/components/pages/admin/manage-courses"

export function FacultyHome() {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/courses")
        const data = await res.json()
        // Only show courses created by this faculty
        const filteredCourses = data.courses.filter((c: any) => c.created_by === user?.id)
        setCourses(filteredCourses)
        console.log("Faculty courses:", filteredCourses)
      } catch (e) {
        setCourses([])
      } finally {
        setLoading(false)
      }
    }
    if (user?.id) fetchCourses()
  }, [user?.id])

  const stats = [
    {
      title: "Courses",
      value: courses.length.toString(),
      description: "created courses",
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      title: "Students",
      value: "67",
      description: "Across all classes",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Requests",
      value: "3",
      description: "Lab component requests",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Attendance Rate",
      value: "92%",
      description: "This semester",
      icon: ClipboardCheck,
      color: "text-purple-600",
    },
    {
      title: "Bookings",
      value: "5",
      description: "Upcoming location bookings",
      icon: CheckCircle,
      color: "text-pink-600",
    },
    {
      title: "Pending Approvals",
      value: "2",
      description: "Requests to review",
      icon: AlertTriangle,
      color: "text-yellow-600",
    },
  ]

  const recentActivities = [
    {
      type: "request",
      message: "New lab component request from Jane Doe",
      time: "2 hours ago",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      type: "attendance",
      message: "Attendance marked for CS101",
      time: "4 hours ago",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      type: "overdue",
      message: "Tom Brown has overdue lab components",
      time: "1 day ago",
      icon: AlertTriangle,
      color: "text-red-600",
    },
    {
      type: "booking",
      message: "You booked Room 204 for tomorrow",
      time: "6 hours ago",
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      type: "project",
      message: "Project submission deadline for AI Lab is next week",
      time: "3 days ago",
      icon: ClipboardCheck,
      color: "text-purple-600",
    },
  ]

  const quickActions = [
    {
      title: "Mark Attendance",
      description: "Record student attendance",
    },
    {
      title: "Assign Project",
      description: "Create new student project",
    },
    {
      title: "Book Location",
      description: "Reserve a classroom or lab",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
        <p className="text-gray-600 mt-2">Here's what's happening with your courses today</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
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

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <activity.icon className={`h-4 w-4 ${activity.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you can perform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-rows-3 gap-0.5">
              {quickActions.map((action, idx) => (
                <button key={idx} className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm text-gray-500">{action.description}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
