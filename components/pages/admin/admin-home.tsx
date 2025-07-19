"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, BookOpen, MapPin, Wrench, TrendingUp } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useTheme } from "next-themes"

interface AdminHomeProps {
  onPageChange?: (page: string) => void
}

export function AdminHome({ onPageChange }: AdminHomeProps) {
  const { user } = useAuth()
  const { theme } = useTheme();
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return

      try {
        const response = await fetch('/api/dashboard/admin', {
          headers: {
            'x-user-id': user.id.toString()
          }
        })

        if (response.ok) {
          const data = await response.json()
          setDashboardData(data)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user?.id])

  const stats = dashboardData ? [
    {
      title: "Faculty",
      value: dashboardData.stats.faculty.toString(),
      description: "Active",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Students",
      value: dashboardData.stats.students.toString(),
      description: "Enrolled",
      icon: GraduationCap,
      color: "text-green-600",
    },
    {
      title: "Courses",
      value: dashboardData.stats.courses.toString(),
      description: "Currently offered",
      icon: BookOpen,
      color: "text-purple-600",
    },
    {
      title: "Locations",
      value: dashboardData.stats.locations.toString(),
      description: "Available spaces",
      icon: MapPin,
      color: "text-orange-600",
    },
    {
      title: "Lab Components",
      value: dashboardData.stats.labComponents.toString(),
      description: "Total inventory",
      icon: Wrench,
      color: "text-red-600",
    },
    {
      title: "System Usage(*)",
      value: `${dashboardData.stats.systemUsage}%`,
      description: "Active user rate",
      icon: TrendingUp,
      color: "text-indigo-600",
    },
  ] : []

  const quickActionsRef = useRef<HTMLDivElement>(null);
  const [highlightQuickActions, setHighlightQuickActions] = useState(false);
  const handleQuickActionsClick = () => {
    quickActionsRef.current?.scrollIntoView({ behavior: 'smooth' });
    setHighlightQuickActions(true);
    setTimeout(() => setHighlightQuickActions(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="rounded-lg shadow-2xl p-4 min-h-[100px] flex flex-col md:flex-row items-center justify-between relative overflow-hidden" style={{ background: "linear-gradient(120deg, #0056a6 0%, #2196f3 30%, #00b6e3 60%, #ffb347 85%, #ff7f32 100%)" }}>
        <div className="flex-1 z-6">
          <div className="flex items-center mb-2 justify-between">
            <span className="text-white text-2xl font-extrabold tracking-tight">CIE Admin Portal</span>
            <div className="flex gap-4">
              <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transition-colors text-lg opacity-100">Learn More</button>
              <button className="bg-white hover:bg-gray-100 text-blue-700 font-semibold px-8 py-3 rounded-lg shadow-lg transition-colors text-lg opacity-100" onClick={handleQuickActionsClick}>Quick Actions</button>
            </div>
          </div>
          <h2 className="text-3xl md:text-3xl font-extrabold text-white mb-2">Are you ready to manage innovation?</h2>
          <p className="text-white/90 mb-4 max-w-2xl text-lg whitespace-nowrap">Welcome to the Centre for Innovation & Entrepreneurship, oversee faculty, students, courses, and more—all in one place.</p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow animate-pulse" style={theme === 'light' ? { background: '#e3f0ff' } : {}}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow transform hover:scale-105 focus:scale-105 transition-transform duration-200" style={theme === 'light' ? { background: '#e3f0ff' } : {}}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card
          ref={quickActionsRef}
          className={`transform transition-transform duration-300 hover:scale-105 focus:scale-105 ${highlightQuickActions ? 'scale-110 ring-4 ring-blue-400/60 z-20' : ''}`}
        >
          <CardHeader>
            <CardTitle className="text-xl">Quick Actions</CardTitle>
            <CardDescription className="text-md">Common administrative tasks</CardDescription>
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
