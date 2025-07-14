"use client"

import { useAuth } from "@/components/auth-provider"
import { LoginForm } from "@/components/login-form"
import { AdminDashboard } from "@/components/dashboards/admin-dashboard"
import { FacultyDashboard } from "@/components/dashboards/faculty-dashboard"
import { StudentDashboard } from "@/components/dashboards/student-dashboard"
import { useEffect, useState } from "react"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Add debug logging
  useEffect(() => {
    console.log("HomePage render - User:", user, "IsLoading:", isLoading, "Mounted:", mounted)
  }, [user, isLoading, mounted])

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    console.log("Rendering LoginForm - no user found")
    return <LoginForm />
  }

  console.log("Rendering dashboard for user role:", user.role)

  // Render appropriate dashboard based on user role
  switch (user.role) {
    case "ADMIN":
      return <AdminDashboard />
    case "FACULTY":
      return <FacultyDashboard />
    case "STUDENT":
      return <StudentDashboard />
    default:
      console.log("Unknown role, rendering LoginForm. Role:", user.role)
      return <LoginForm />
  }
}
