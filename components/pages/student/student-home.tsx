"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { BookOpen, FolderOpen, ClipboardCheck, Clock, Calendar, MapPin } from "lucide-react"
import { useRef, useState } from "react"

interface StudentHomeProps {
  onPageChange?: (page: string) => void
}

export function StudentHome({ onPageChange }: StudentHomeProps) {
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

  const quickActionsRef = useRef<HTMLDivElement>(null);
  const [highlightQuickActions, setHighlightQuickActions] = useState(false);
  const handleQuickActionsClick = () => {
    quickActionsRef.current?.scrollIntoView({ behavior: 'smooth' });
    setHighlightQuickActions(true);
    setTimeout(() => setHighlightQuickActions(false), 1000);
  };

  return (
    <div className="space-y-6 min-h-screen">
      {(() => {
        return (
          <>
            {/* Colorful Hero Window */}
            <div className="rounded-3xl shadow-2xl bg-gradient-to-br from-[#0056a6] via-[#00b6e3] to-[#ff7f32] p-12 min-h-[320px] flex flex-col md:flex-row items-center justify-between mb-4 relative overflow-hidden">
              <div className="flex-1 z-10">
                <div className="flex items-center mb-6">
                  <span className="bg-white rounded-xl p-2 shadow mr-6 flex items-center justify-center"><img src="/logo.png" alt="CIE Logo" className="h-16 w-auto" /></span>
                  <span className="text-white text-4xl font-extrabold tracking-tight">CIE Student Portal</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">Welcome to your learning hub!</h2>
                <p className="text-white/90 mb-8 max-w-2xl text-lg">Track your courses, projects, and academic progress—all in one place.</p>
                <div className="flex gap-6">
                  <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-lg shadow transition-colors text-lg">Learn More</button>
                  <button className="bg-white hover:bg-gray-100 text-blue-700 font-semibold px-8 py-3 rounded-lg shadow transition-colors text-lg" onClick={handleQuickActionsClick}>Quick Actions</button>
                </div>
              </div>
              <img src="/logo.png" alt="CIE Watermark" className="absolute right-10 bottom-0 opacity-10 h-64 w-auto hidden md:block select-none pointer-events-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              {stats.map((stat, index) => (
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
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="transform hover:scale-105 focus:scale-105 transition-transform duration-200">
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

              <Card className="transform hover:scale-105 focus:scale-105 transition-transform duration-200">
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

              <Card className="transform hover:scale-105 focus:scale-105 transition-transform duration-200">
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

              <Card
                ref={quickActionsRef}
                className={`transform transition-transform duration-300 hover:scale-105 focus:scale-105 ${highlightQuickActions ? 'scale-110 ring-4 ring-blue-400/60 z-20' : ''}`}
              >
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <button 
                      onClick={() => onPageChange?.("lab-components")}
                      className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium">Request Lab Components</div>
                      <div className="text-sm text-gray-500">Borrow equipment for projects</div>
                    </button>
                    <button 
                      onClick={() => onPageChange?.("attendance")}
                      className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium">View Attendance</div>
                      <div className="text-sm text-gray-500">Check your attendance record</div>
                    </button>
                    <button 
                      onClick={() => onPageChange?.("courses")}
                      className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium">Browse Courses</div>
                      <div className="text-sm text-gray-500">Explore available courses</div>
                    </button>
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
