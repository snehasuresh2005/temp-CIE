"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Home, MapPin, Calendar, BookOpen, FolderOpen, ClipboardCheck, Wrench } from "lucide-react"
import { StudentHome } from "@/components/pages/student/student-home"
import { StudentCalendar } from "@/components/pages/student/student-calendar"
import { LabComponentsRequest } from "@/components/pages/student/lab-components-request"
import { ViewCourses } from "@/components/pages/student/view-courses"
import { ViewProjects } from "@/components/pages/student/view-projects"
import { ViewAttendance } from "@/components/pages/student/view-attendance"

const menuItems = [
  { id: "home", label: "Dashboard", icon: Home },
  { id: "locations", label: "Class Locations", icon: MapPin },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "projects", label: "Projects", icon: FolderOpen },
  { id: "attendance", label: "Attendance", icon: ClipboardCheck },
  { id: "lab-components", label: "Lab Components", icon: Wrench },
]

export function StudentDashboard() {
  const [currentPage, setCurrentPage] = useState("home")

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <StudentHome onPageChange={setCurrentPage} />
      case "locations":
        return (
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold">Class Locations</h2>
            <p className="text-gray-600 mt-2">Coming soon...</p>
          </div>
        )
      case "calendar":
        return <StudentCalendar />
      case "courses":
        return <ViewCourses />
      case "projects":
        return <ViewProjects />
      case "attendance":
        return <ViewAttendance />
      case "lab-components":
        return <LabComponentsRequest />
      default:
        return <StudentHome onPageChange={setCurrentPage} />
    }
  }

  return (
    <DashboardLayout currentPage={currentPage} onPageChange={setCurrentPage} menuItems={menuItems}>
      {renderPage()}
    </DashboardLayout>
  )
}
