"use client"

import type React from "react"
import type { ReactNode } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  GraduationCap,
  LogOut,
  Menu,
  ChevronLeft,
  User,
  Mail,
  BadgeIcon as IdCard,
  Users,
  BookOpen,
  Phone,
  MapPin,
  Calendar,
  Moon,
  Sun,
  Bell,
  BarChart3,
  Award,
  Briefcase,
  Wrench,
  FolderOpen,
  ClipboardCheck,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useTheme } from 'next-themes'
import { NotificationDropdown } from "@/components/ui/notification-dropdown"
import { useNotifications } from "@/components/notification-provider"

interface DashboardLayoutProps {
  children: ReactNode
  currentPage: string
  onPageChange: (page: string) => void
  menuItems: Array<{
    id: string
    label: string
    icon: React.ComponentType<any>
  }>
}

// Profile data interfaces
interface BaseProfileData {
  name: string
  email: string
  id: string
  role: string
  phone: string | undefined
  join_date: string | Date
}

interface AdminProfileData extends BaseProfileData {
  role: "admin"
  department: string
  office: string
  permissions: string[]
  working_hours: string
}

interface FacultyProfileData extends BaseProfileData {
  role: "faculty"
  department: string
  office: string
  assigned_courses: string[]
  specialization: string
  office_hours: string
}

interface ProfessorProfileData extends BaseProfileData {
  role: "professor"
  department: string
  office: string
  assigned_courses: string[]
  specialization: string
  office_hours: string
}

interface StudentProfileData extends BaseProfileData {
  role: "student"
  student_id: string
  program: string
  year: string
  section: string
  gpa: string
  advisor: string
}

type ProfileData = AdminProfileData | FacultyProfileData | ProfessorProfileData | StudentProfileData

// Type guards
function isAdminProfile(data: ProfileData): data is AdminProfileData {
  return data.role === "admin"
}

function isFacultyProfile(data: ProfileData): data is FacultyProfileData {
  return data.role === "faculty"
}

function isProfessorProfile(data: ProfileData): data is ProfessorProfileData {
  return data.role === "professor"
}

function isStudentProfile(data: ProfileData): data is StudentProfileData {
  return data.role === "student"
}

export function DashboardLayout({ children, currentPage, onPageChange, menuItems }: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { theme, setTheme } = useTheme()
  const { activities, unreadActivities, loading } = useNotifications()

  const sidebarWidth = sidebarCollapsed ? "w-16" : "w-64"
  const mainMargin = sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800"
      case "FACULTY":
        return "bg-blue-100 text-blue-800"
      case "PROFESSOR":
        return "bg-purple-100 text-purple-800"
      case "STUDENT":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Hardcoded profile data based on user role
  const getProfileData = (): ProfileData | null => {
    if (!user) return null

    const baseData = {
      name: user.name,
      email: user.email,
      id: user.id,
      phone: user.phone,
      join_date: user.join_date,
    }

    switch (user.role) {
      case "ADMIN":
        return {
          ...baseData,
          role: "admin" as const,
          department: "Administration",
          office: "Admin Building, Room 101",
          permissions: ["Full System Access", "User Management", "System Configuration"],
          working_hours: "9:00 AM - 5:00 PM",
        }
      case "FACULTY":
        return {
          ...baseData,
          role: "faculty" as const,
          department: "Computer Science",
          office: "Engineering Building, Room 205",
          assigned_courses: ["CS101 - Intro to Programming", "CS201 - Data Structures", "CS301 - Algorithms"],
          specialization: "Software Engineering",
          office_hours: "Mon-Wed-Fri: 2:00 PM - 4:00 PM",
        }
      case "STUDENT":
        return {
          ...baseData,
          role: "student" as const,
          student_id: "STU2024001",
          program: "Bachelor of Computer Science",
          year: "3rd Year",
          section: "Section A",
          gpa: "3.85",
          advisor: "Dr. John Smith",
        }
      default:
        return {
          ...baseData,
          role: "student" as const,
          student_id: "STU2024001",
          program: "Bachelor of Computer Science",
          year: "3rd Year",
          section: "Section A",
          gpa: "3.85",
          advisor: "Dr. John Smith",
        }
    }
  }

  const profileData = getProfileData()

  // Get role-specific quick actions
  const getQuickActions = () => {
    if (!user) return []
    
    switch (user.role) {
      case "ADMIN":
        return [
          { id: "domains", label: "Coordinators", icon: Award },
          { id: "faculty", label: "Faculty", icon: Briefcase },
          { id: "students", label: "Students", icon: Users },
          { id: "locations", label: "Room Bookings", icon: MapPin },
        ]
      case "FACULTY":
        return [
          { id: "coordinator", label: "CIE Coordinator", icon: Award },
          { id: "projects", label: "Projects", icon: FolderOpen },
          { id: "locations", label: "Book Room", icon: MapPin },
          { id: "lab-components", label: "Lab Components", icon: Wrench },
          { id: "library", label: "Library", icon: BookOpen },
        ]
      case "STUDENT":
        return [
          { id: "projects", label: "Projects", icon: FolderOpen },
          { id: "lab-components", label: "Lab Components", icon: Wrench },
          { id: "library", label: "Library", icon: BookOpen },
          { id: "attendance", label: "Attendance", icon: ClipboardCheck },
        ]
      default:
        return []
    }
  }

  const quickActions = getQuickActions()

  const handleSignOut = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-white dark:bg-dark5 dark:text-dark1">
      {/* Navbar */}
      <div
        className={cn(
          "fixed top-0 right-0 left-0 h-16 bg-white dark:bg-dark4 border-b border-gray-200 dark:border-dark3 z-30 transition-all duration-300",
          sidebarCollapsed ? "lg:left-16" : "lg:left-64",
        )}
      >
        <div className="flex items-center justify-between h-full px-4">
          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Button variant="outline" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Actions - Middle Section */}
          <div className={`hidden lg:flex items-center space-x-4 flex-1 ${
            sidebarCollapsed ? 'justify-start pl-4' : 'justify-center'
          }`}>
            <div className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Quick Actions:</span>
              {quickActions.map((action) => (
                <Button
                  key={action.id}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full transition-all duration-200 hover:bg-white dark:hover:bg-gray-700"
                  onClick={() => onPageChange(action.id)}
                  title={action.label}
                >
                  <action.icon className="h-5 w-5 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white" />
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark mode toggle button */}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle dark mode"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <NotificationDropdown activities={activities} loading={loading} onPageChange={onPageChange} />

            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 px-3 rounded-full flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className="font-medium text-gray-900 text-sm">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() : ''}
                      </p>
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={user?.role === 'FACULTY' && user?.profileData?.faculty_id ? `/profile-img/${user.profileData.faculty_id}.jpg` : undefined}
                        alt={user?.name || 'User avatar'}
                        onError={(e) => {
                          // Try different extensions if jpg fails
                          const currentSrc = e.currentTarget.src;
                          if (currentSrc.includes('.jpg')) {
                            e.currentTarget.src = currentSrc.replace('.jpg', '.jpeg');
                          } else if (currentSrc.includes('.jpeg')) {
                            e.currentTarget.src = currentSrc.replace('.jpeg', '.png');
                          }
                        }}
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-sm">
                        {user?.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" forceMount>
                <DropdownMenuItem onClick={() => onPageChange('profile')} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* Sign Out Button */}
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="font-medium">Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 transform transition-all duration-500 ease-in-out lg:translate-x-0 rounded-r-2xl overflow-hidden shadow-2xl",
          sidebarWidth,
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "bg-gradient-to-b from-blue-100 to-indigo-100 dark:bg-dark4 dark:text-dark1"
        )}
        style={{
          boxShadow: '4px 0 15px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header with gradient */}
          <div className="flex items-center justify-center h-20 px-4 border-b border-indigo-200 bg-white/90">
            <div className="relative w-full h-full flex items-center justify-center p-2">
              {sidebarCollapsed ? (
                <img 
                  src="/logo-collapse.png" 
                  alt="Logo Collapsed" 
                  className="object-contain h-12 w-12 transition-all duration-300 hover:scale-110"
                />
              ) : (
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="object-contain max-h-full w-48 transition-all duration-300 hover:scale-105"
                />
              )}
            </div>
          </div>

          {/* Navigation with animated items */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item, index) => (
              <div 
                key={item.id}
                className="px-2 py-1 group"
                style={{
                  animation: `fadeIn 0.3s ease-out ${index * 0.05}s forwards`,
                  opacity: 0,
                  transform: 'translateX(-10px)'
                }}
              >
                <button
                  className={cn(
                    "w-full flex items-center p-3 transition-all duration-200 rounded-lg mx-1 transform hover:scale-105 focus:scale-105",
                    sidebarCollapsed ? "justify-center px-2" : "px-4",
                    currentPage === item.id
                      ? "bg-indigo-200 text-indigo-800 font-medium shadow-sm"
                      : "text-gray-800 hover:bg-blue-100 hover:text-indigo-800 dark:text-dark1"
                  )}
                  onClick={() => {
                    onPageChange(item.id)
                    setSidebarOpen(false)
                  }}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <item.icon 
                    className={cn(
                      "h-5 w-5 transition-transform duration-300",
                      !sidebarCollapsed && "mr-3",
                      currentPage === item.id ? "text-blue-600" : "text-gray-600 dark:text-dark1"
                    )} 
                  />
                  {!sidebarCollapsed && (
                    <span className="text-sm font-medium">
                      {item.label}
                    </span>
                  )}
                </button>
              </div>
            ))}
          </nav>

          {/* Add keyframe animations */}
          <style jsx global>{`
            @keyframes fadeIn {
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
          `}</style>

          {/* Bottom navigation items */}
          <div className="px-2 py-1 mt-auto">
            {/* Bottom navigation items removed */}
          </div>

          {/* Collapse button */}
          <div className="hidden lg:block p-2 border-t border-gray-100">
            <button
              className={cn(
                "w-full flex items-center text-gray-600 hover:bg-gray-100 p-2 rounded transition-all duration-200",
                sidebarCollapsed ? "justify-center px-2" : "px-3"
              )}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <ChevronLeft
                className={cn(
                  "h-5 w-5 transition-transform duration-300",
                  sidebarCollapsed ? "rotate-180" : "",
                  !sidebarCollapsed && "mr-3"
                )}
              />
              {!sidebarCollapsed && (
                <span className="text-sm font-medium transition-opacity duration-300">
                  Collapse
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={cn("transition-all duration-300", mainMargin)}>
        <div className="pt-16">
          <div className="p-4 lg:p-8 rounded-tl-2xl min-h-[calc(100vh-4rem)]">{children}</div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
