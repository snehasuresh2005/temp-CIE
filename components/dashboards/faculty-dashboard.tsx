"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Home, Users, MapPin, Calendar, FolderOpen, ClipboardCheck, Wrench } from "lucide-react"
import { FacultyHome } from "@/components/pages/faculty/faculty-home"
import { LabComponentsManagement } from "@/components/pages/faculty/lab-components-management"
import { FacultyCalendar } from "@/components/pages/faculty/faculty-calendar"
import { FacultyViewCourses } from "@/components/pages/faculty/view-courses"
import { ProjectManagement } from "@/components/pages/faculty/project-management"
import { AttendanceManagement } from "@/components/pages/faculty/attendance-management"

const menuItems = [
  { id: "home", label: "Dashboard", icon: Home },
  { id: "courses", label: "Courses", icon: Users },
  { id: "locations", label: "Class Locations", icon: MapPin },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "projects", label: "Student Projects", icon: FolderOpen },
  { id: "attendance", label: "Attendance", icon: ClipboardCheck },
  { id: "lab-components", label: "Lab Components", icon: Wrench },
]

export function FacultyDashboard() {
  const [currentPage, setCurrentPage] = useState("home")

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <FacultyHome />
      case "courses":
        return <FacultyViewCourses />
      case "locations":
        return (
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold">Class Locations</h2>
            <p className="text-gray-600 mt-2">Coming soon...</p>
          </div>
        )
      case "calendar":
        return <FacultyCalendar />
      case "projects":
        return <ProjectManagement />
      case "attendance":
        return <AttendanceManagement />
      case "lab-components":
        return <LabComponentsManagement />
      default:
        return <FacultyHome />
    }
  }

  return (
    <DashboardLayout currentPage={currentPage} onPageChange={setCurrentPage} menuItems={menuItems}>
      {renderPage()}
    </DashboardLayout>
  )
}
