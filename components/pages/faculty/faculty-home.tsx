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
        setCourses(data.courses.filter((c: any) => c.created_by === user?.id))
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
      description: "Your created courses",
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      title: "Total Students",
      value: "67",
      description: "Across all classes",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Pending Requests",
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
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
        <p className="text-gray-600 mt-2">Here's what's happening with your courses today</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                courses.map((course: any) => (
                  <div key={course.course_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{course.course_name}</h3>
                      <p className="text-sm text-gray-500">{course.course_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{course.course_enrollments} students</p>
                      <p className="text-xs text-gray-500">{course.course_start_date} - {course.course_end_date}</p>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks you can perform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="font-medium">Mark Attendance</div>
              <div className="text-sm text-gray-500">Record student attendance</div>
            </button>
            <button className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="font-medium">Review Lab Requests</div>
              <div className="text-sm text-gray-500">Approve component requests</div>
            </button>
            <button className="p-4 text-left border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="font-medium">Assign Project</div>
              <div className="text-sm text-gray-500">Create new student project</div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
