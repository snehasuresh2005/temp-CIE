"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Home, Users, User as UserIcon, BookOpen, Wrench, MapPin, Calendar, Building, Briefcase, Award } from "lucide-react"
import { AdminHome } from "@/components/pages/admin/admin-home"
import { ManageFaculty } from "@/components/pages/admin/manage-faculty"
import { ManageStudents } from "@/components/pages/admin/manage-students"
import { ManageCourses } from "@/components/pages/admin/manage-courses"
import { ManageLabComponents } from "@/components/pages/admin/manage-lab-components"
import { ManageLocations } from "@/components/pages/admin/manage-locations"
import { ManageClassSchedules } from "@/components/pages/admin/manage-class-schedules"
import { UserProfile } from "@/components/common/user-profile"
import { ManageLibrary } from "@/components/pages/admin/manage-library"
import { ManageDomains } from "@/components/pages/admin/manage-domains"
import { ManageProjects } from "@/components/pages/admin/manage-projects"
import AdminInternshipManager from '@/components/internships/AdminInternshipManager'

const menuItems = [
  { id: "home", label: "Dashboard", icon: Home },
  { id: "domains", label: "Coordinators", icon: Award },
  { id: "faculty", label: "Faculty", icon: Briefcase },
  { id: "students", label: "Students", icon: Users },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "schedules", label: "Class Schedules", icon: Calendar },
  { id: "locations", label: "Locations", icon: MapPin },
  { id: "lab-components", label: "Lab Components", icon: Wrench },
  { id: "library", label: "Library", icon: BookOpen },
  { id: "projects", label: "Projects", icon: BookOpen },
  { id: "internships", label: "Internships", icon: BookOpen },
]

export function AdminDashboard() {
  const [currentPage, setCurrentPage] = useState("home")

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <AdminHome onPageChange={setCurrentPage} />
      case "domains":
        return <ManageDomains />
      case "faculty":
        return <ManageFaculty />
      case "students":
        return <ManageStudents />
      case "courses":
        return <ManageCourses />
      case "schedules":
        return <ManageClassSchedules />
      case "locations":
        return <ManageLocations />
      case "lab-components":
        return <ManageLabComponents />
      case "profile":
        return <UserProfile />
      case "library":
        return <ManageLibrary />
      case "projects":
        return <ManageProjects />
      case "internships":
        return <AdminInternshipManager />
      default:
        return <AdminHome onPageChange={setCurrentPage} />
    }
  }

  return (
    <DashboardLayout currentPage={currentPage} onPageChange={setCurrentPage} menuItems={menuItems}>
      {renderPage()}
    </DashboardLayout>
  )
}
