"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { BookOpen, FolderOpen, ClipboardCheck, Clock, Calendar, MapPin } from "lucide-react"

export function StudentHome() {
  const { user } = useAuth()

  const stats = [
    {
      title: "Enrolled Courses",
      value: "4",
      description: "Active",
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      title: "Active Projects",
      value: "2",
      description: "In progress",
      icon: FolderOpen,
      color: "text-green-600",
    },
    {
      title: "Attendance Rate",
      value: "94%",
      description: "This semester",
      icon: ClipboardCheck,
      color: "text-purple-600",
    },
    {
      title: "Borrowed Items",
      value: "4",
      description: "Lab components",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Overdue Items",
      value: "2",
      description: "Lab components",
      icon: Calendar,
      color: "text-pink-600",
    },
    {
      title: "Pending Tasks",
      value: "3",
      description: "Assignments",
      icon: ClipboardCheck,
      color: "text-yellow-600",
    },
  ]

  const upcomingClasses = [
    {
      course: "CS101",
      title: "Introduction to Computer Science",
      time: "09:00 AM",
      room: "A101",
      instructor: "Dr. John Smith",
    },
    {
      course: "MATH101",
      title: "Calculus I",
      time: "11:00 AM",
      room: "B205",
      instructor: "Dr. Sarah Johnson",
    },
    {
      course: "PHY101",
      title: "Physics I",
      time: "02:00 PM",
      room: "C301",
      instructor: "Prof. Michael Brown",
    },
  ]

  const recentActivities = [
    {
      type: "assignment",
      message: "New project assigned in CS101",
      time: "2 hours ago",
      icon: FolderOpen,
      color: "text-blue-600",
    },
    {
      type: "attendance",
      message: "Attendance marked for MATH101",
      time: "1 day ago",
      icon: ClipboardCheck,
      color: "text-green-600",
    },
    {
      type: "component",
      message: "Lab component request approved",
      time: "2 days ago",
      icon: Clock,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
        <p className="text-gray-600 mt-2">Here's your academic overview for today</p>
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
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Today's Classes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingClasses.map((class_item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{class_item.course}</h3>
                    <p className="text-sm text-gray-600">{class_item.title}</p>
                    <p className="text-xs text-gray-500">{class_item.instructor}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{class_item.time}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <MapPin className="h-3 w-3 mr-1" />
                      {class_item.room}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
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
            <CardTitle>Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">Database Design Project</h3>
                    <p className="text-sm text-gray-600">CS201 - Data Structures</p>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">In Progress</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Due: January 30, 2024</p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">Calculus Problem Set</h3>
                    <p className="text-sm text-gray-600">MATH101 - Calculus I</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Submitted</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Submitted: January 20, 2024</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks you can perform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <div className="font-medium">Request Lab Components</div>
              <div className="text-sm text-gray-500">Borrow equipment for projects</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <div className="font-medium">View Attendance</div>
              <div className="text-sm text-gray-500">Check your attendance record</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <div className="font-medium">Browse Courses</div>
              <div className="text-sm text-gray-500">Explore available courses</div>
            </button>
          </div>
        </CardContent>
      </Card> */}
    </div>
  )
}
