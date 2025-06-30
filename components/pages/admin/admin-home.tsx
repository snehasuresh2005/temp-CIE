"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, BookOpen, MapPin, Wrench, TrendingUp } from "lucide-react"

interface AdminHomeProps {
  onPageChange?: (page: string) => void
}

export function AdminHome({ onPageChange }: AdminHomeProps) {
  const stats = [
    {
      title: "Faculty",
      value: "24 (*)",
      description: "Active",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Students",
      value: "342 (*)",
      description: "Enrolled",
      icon: GraduationCap,
      color: "text-green-600",
    },
    {
      title: "Courses",
      value: "18 (*)",
      description: "Currently offered",
      icon: BookOpen,
      color: "text-purple-600",
    },
    {
      title: "Locations",
      value: "12 (*)",
      description: "Available classrooms",
      icon: MapPin,
      color: "text-orange-600",
    },
    {
      title: "Lab Components",
      value: "156 (*)",
      description: "Total inventory",
      icon: Wrench,
      color: "text-red-600",
    },
    {
      title: "System Usage ??",
      value: "94% (*)",
      description: "Active user rate",
      icon: TrendingUp,
      color: "text-indigo-600",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to the CIE University Management System</p>
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
            <CardTitle>System Alerts (*)</CardTitle>
            <CardDescription>Critical items requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Low Stock Alert</p>
                  <p className="text-xs text-red-600">Arduino Uno - Only 2 units remaining</p>
                </div>
                <span className="text-xs text-red-500">High</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">Pending Approvals</p>
                  <p className="text-xs text-yellow-600">7 faculty applications waiting review</p>
                </div>
                <span className="text-xs text-yellow-500">Medium</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-800">Overdue Returns</p>
                  <p className="text-xs text-orange-600">5 lab components overdue for return</p>
                </div>
                <span className="text-xs text-orange-500">Medium</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">System Status</p>
                  <p className="text-xs text-blue-600">All systems operational - 99.9% uptime</p>
                </div>
                <span className="text-xs text-blue-500">Info</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities (*)</CardTitle>
            {/* <CardDescription>Latest system activities</CardDescription> */}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New faculty member added</p>
                  <p className="text-xs text-gray-500">Dr. Sarah Johnson - Computer Science</p>
                </div>
                <span className="text-xs text-gray-400">2 hours ago</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Course updated</p>
                  <p className="text-xs text-gray-500">CS301 - Database Systems</p>
                </div>
                <span className="text-xs text-gray-400">4 hours ago</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Lab components restocked</p>
                  <p className="text-xs text-gray-500">Arduino Uno boards - 20 units</p>
                </div>
                <span className="text-xs text-gray-400">1 day ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
        

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions (*)</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button 
                onClick={() => onPageChange?.("faculty")}
                className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium">Add New Faculty</div>
                <div className="text-sm text-gray-500">Register a new faculty member</div>
              </button>
              <button 
                onClick={() => onPageChange?.("courses")}
                className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium">Create Course</div>
                <div className="text-sm text-gray-500">Add a new course offering</div>
              </button>
              <button 
                onClick={() => onPageChange?.("schedules")}
                className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium">Assign Classes</div>
                <div className="text-sm text-gray-500">Assign classes to faculty</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
