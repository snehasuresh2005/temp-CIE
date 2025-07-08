"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Home, Users, User as UserIcon, MapPin, Calendar, FolderOpen, ClipboardCheck, Wrench, BookOpen, Settings } from "lucide-react"
import { ProfessorHome } from "@/components/pages/professor/professor-home"
import { LabComponentsManagement } from "@/components/pages/faculty/lab-components-management"
import { ProfessorCalendar } from "@/components/pages/professor/professor-calendar"
import { ProfessorViewCourses } from "@/components/pages/professor/view-courses"
import { ProjectManagement } from "@/components/pages/faculty/project-management"
import { AttendanceManagement } from "@/components/pages/faculty/attendance-management"
import { LocationBooking } from "@/components/pages/faculty/location-booking"
import { UserProfile } from "@/components/common/user-profile"
import { LibraryRequest } from "@/components/pages/student/library-request"
import { LibraryManagement } from "@/components/pages/faculty/library-management"
import { CoordinatorDashboard } from "@/components/pages/faculty/coordinator-dashboard"
import { useAuth } from "@/components/auth-provider"

export function ProfessorDashboard() {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const { user } = useAuth()

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "projects", label: "Projects", icon: FolderOpen },
    { id: "attendance", label: "Attendance", icon: ClipboardCheck },
    { id: "lab-components", label: "Lab Components", icon: Wrench },
    { id: "location-booking", label: "Location Booking", icon: MapPin },
    { id: "library-request", label: "Library Request", icon: BookOpen },
    { id: "library-management", label: "Library Management", icon: BookOpen },
    { id: "coordinator", label: "Coordinator", icon: Settings },
    { id: "profile", label: "Profile", icon: UserIcon },
  ]

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <ProfessorHome />
      case "calendar":
        return <ProfessorCalendar />
      case "courses":
        return <ProfessorViewCourses />
      case "projects":
        return <ProjectManagement />
      case "attendance":
        return <AttendanceManagement />
      case "lab-components":
        return <LabComponentsManagement />
      case "location-booking":
        return <LocationBooking />
      case "library-request":
        return <LibraryRequest />
      case "library-management":
        return <LibraryManagement />
      case "coordinator":
        return <CoordinatorDashboard />
      case "profile":
        return <UserProfile />
      default:
        return <ProfessorHome />
    }
  }

  return (
    <DashboardLayout
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      menuItems={menuItems}
    >
      {renderPage()}
    </DashboardLayout>
  )
}