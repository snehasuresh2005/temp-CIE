"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, BookOpen, MapPin, Wrench, TrendingUp } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"

interface AdminHomeProps {
  onPageChange?: (page: string) => void
}

export function AdminHome({ onPageChange }: AdminHomeProps) {
  const { user } = useAuth()
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
      {(() => {
        return (
          <>
            {/* Colorful Hero Window */}

            <div className="rounded-3xl shadow-2xl bg-gradient-to-br from-[#0056a6] via-[#00b6e3] to-[#ff7f32] p-12 min-h-[320px] flex flex-col md:flex-row items-center justify-between mb-4 relative overflow-hidden">
              <div className="flex-1 z-10">
                <div className="flex items-center mb-6">
                  <span className="text-4xl font-extrabold tracking-tight text-white">CIE Admin Portal</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-gray-900 dark:text-white">Are you ready to manage innovation?</h2>
                <p className="mb-8 max-w-2xl text-lg text-gray-700 dark:text-white/90">Welcome to the Centre for Innovation & Entrepreneurship. Oversee faculty, students, courses, and more—all in one place.</p>
                <div className="flex gap-6">
                  <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-lg shadow transition-colors text-lg">Learn More</button>
                  <button className="bg-white hover:bg-gray-100 text-blue-700 font-semibold px-8 py-3 rounded-lg shadow transition-colors text-lg" onClick={handleQuickActionsClick}>Quick Actions</button>

                </div>
              
              {/* <img src="/logo.png" alt="CIE Watermark" className="absolute right-10 bottom-0 opacity-10 h-64 w-auto hidden md:block select-none pointer-events-none" /> */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow animate-pulse">
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
                ))
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="transform hover:scale-105 focus:scale-105 transition-transform duration-200">
                <CardHeader>
                  <CardTitle className="text-xl">System Alerts</CardTitle>
                  <CardDescription className="text-md">Critical items requiring attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loading ? (
                      Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg animate-pulse">
                          <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                            <div className="h-3 bg-gray-200 rounded w-48"></div>
                          </div>
                          <div className="h-3 bg-gray-200 rounded w-12"></div>
                        </div>
                      ))
                    ) : dashboardData?.alerts?.length > 0 ? (
                      dashboardData.alerts.map((alert: any, index: number) => {
                        const colorClasses = {
                          red: 'bg-red-50 border-red-200',
                          yellow: 'bg-yellow-50 border-yellow-200',
                          orange: 'bg-orange-50 border-orange-200',
                          blue: 'bg-blue-50 border-blue-200',
                          green: 'bg-green-50 border-green-200'
                        }[alert.color] || 'bg-gray-50 border-gray-200'
                        
                        const textClasses = {
                          red: 'text-red-800',
                          yellow: 'text-yellow-800',
                          orange: 'text-orange-800',
                          blue: 'text-blue-800',
                          green: 'text-green-800'
                        }[alert.color] || 'text-gray-800'
                        
                        const dotColor = {
                          red: 'bg-red-600',
                          yellow: 'bg-yellow-600',
                          orange: 'bg-orange-600',
                          blue: 'bg-blue-600',
                          green: 'bg-green-600'
                        }[alert.color] || 'bg-gray-600'
                        
                        const priorityColor = {
                          red: 'text-red-500',
                          yellow: 'text-yellow-500',
                          orange: 'text-orange-500',
                          blue: 'text-blue-500',
                          green: 'text-green-500'
                        }[alert.color] || 'text-gray-500'
                        
                        return (
                          <div key={index} className={`flex items-center space-x-3 p-3 border rounded-lg ${colorClasses}`}>
                            <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${textClasses}`}>{alert.message}</p>
                              {alert.details && (
                                <p className={`text-xs opacity-75 ${textClasses}`}>{alert.details}</p>
                              )}
                            </div>
                            <span className={`text-xs capitalize ${priorityColor}`}>{alert.priority}</span>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No alerts at this time</p>
                        <p className="text-xs mt-1">System running smoothly</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className="transform hover:scale-105 focus:scale-105 transition-transform duration-200">
                <CardHeader>
                  <CardTitle className="text-xl">Recent Activities</CardTitle>
                  <CardDescription className="text-md">Latest system activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loading ? (
                      Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="flex items-center space-x-4 animate-pulse">
                          <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-40"></div>
                            <div className="h-3 bg-gray-200 rounded w-32"></div>
                          </div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      ))
                    ) : dashboardData?.activities?.length > 0 ? (
                      dashboardData.activities.slice(0, 4).map((activity: any, index: number) => {
                        const colors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-orange-600', 'bg-red-600', 'bg-indigo-600']
                        const dotColor = colors[index % colors.length]
                        const timeAgo = new Date(activity.time).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })
                        return (
                          <div key={index} className="flex items-center space-x-4">
                            <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{activity.message}</p>
                              <div className="flex items-center space-x-2">
                                <p className="text-xs text-gray-500">{timeAgo}</p>
                                {activity.status && (
                                  <>
                                <span className="text-xs text-gray-300">•</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      activity.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                      activity.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                      activity.status === 'COLLECTED' ? 'bg-blue-100 text-blue-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {activity.status}
                                </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No recent activities</p>
                        <p className="text-xs mt-1">Activities will appear here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              

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
          </>
        );
      })()}
    </div>
  )
}
