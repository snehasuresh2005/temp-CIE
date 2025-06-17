"use client"

import { useAuth } from "@/components/auth-provider"
import { LoginForm } from "@/components/login-form"
import { AdminDashboard } from "@/components/dashboards/admin-dashboard"
import { FacultyDashboard } from "@/components/dashboards/faculty-dashboard"
import { StudentDashboard } from "@/components/dashboards/student-dashboard"

export default function HomePage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  // Render appropriate dashboard based on user role
  switch (user.role) {
    case "admin":
      return <AdminDashboard />
    case "faculty":
      return <FacultyDashboard />
    case "student":
      return <StudentDashboard />
    default:
      return <LoginForm />
  }
}
