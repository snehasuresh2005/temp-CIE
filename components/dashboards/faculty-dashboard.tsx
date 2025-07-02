"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Home, Users, MapPin, Calendar, FolderOpen, ClipboardCheck, Wrench, BookOpen, Moon, Sun } from "lucide-react"
import { FacultyHome } from "@/components/pages/faculty/faculty-home"
import { LabComponentsManagement } from "@/components/pages/faculty/lab-components-management"
import { FacultyCalendar } from "@/components/pages/faculty/faculty-calendar"
import { FacultyViewCourses } from "@/components/pages/faculty/view-courses"
import { ProjectManagement } from "@/components/pages/faculty/project-management"
import { AttendanceManagement } from "@/components/pages/faculty/attendance-management"
import { LocationBooking } from "@/components/pages/faculty/location-booking"
import { LibraryManagement } from "@/components/pages/faculty/library-management"

const menuItems = [
  { id: "home", label: "Dashboard", icon: Home },
  { id: "courses", label: "Courses", icon: Users },
  { id: "locations", label: "Book Locations", icon: MapPin },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "projects", label: "Projects", icon: FolderOpen },
  { id: "attendance", label: "Attendance", icon: ClipboardCheck },
  { id: "lab-components", label: "Lab Components", icon: Wrench },
  { id: "library", label: "Library", icon: BookOpen },
]

export function FacultyDashboard() {
  const [currentPage, setCurrentPage] = useState("home")

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <FacultyHome onPageChange={setCurrentPage} />
      case "courses":
        return <FacultyViewCourses />
      case "locations":
        return <LocationBooking />
      case "calendar":
        return <FacultyCalendar />
      case "projects":
        return <ProjectManagement />
      case "attendance":
        return <AttendanceManagement />
      case "lab-components":
        return <LabComponentsManagement />
      case "library":
        return <LibraryManagement />
      default:
        return <FacultyHome onPageChange={setCurrentPage} />
    }
  }

  return (
    <DashboardLayout currentPage={currentPage} onPageChange={setCurrentPage} menuItems={menuItems}>
      {renderPage()}
    </DashboardLayout>
  )
}
