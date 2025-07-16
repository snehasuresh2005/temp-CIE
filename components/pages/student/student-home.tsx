"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { BookOpen, FolderOpen, ClipboardCheck, Clock, Calendar, MapPin } from "lucide-react"
import { useRef, useState, useEffect } from "react"

interface StudentHomeProps {
  onPageChange?: (page: string) => void
}

export function StudentHome({ onPageChange }: StudentHomeProps) {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return
      
      try {
        const response = await fetch('/api/dashboard/student', {
          headers: {
            'x-user-id': user.id
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setDashboardData(data)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        setDashboardData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user?.id])

  const stats = dashboardData ? [
    {
      title: "Current GPA",
      value: (dashboardData.stats.currentGPA || "N/A").toString(),
      description: "This semester",
      icon: FolderOpen,
      color: "text-green-600",
    },
    {
      title: "Attendance Rate",
      value: dashboardData.stats.attendanceRate !== null ? `${dashboardData.stats.attendanceRate}%` : "N/A",
      description: "This semester",
      icon: ClipboardCheck,
      color: "text-purple-600",
    },
    {
      title: "Borrowed Items",
      value: (dashboardData.stats.borrowedItems || 0).toString(),
      description: "Currently borrowed",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Degree Progress",
      value: `${dashboardData.stats.degreeProgress || 0}%`,
      description: "Completion",
      icon: Calendar,
      color: "text-pink-600",
    },
    {
      title: "Projects",
      value: (dashboardData.stats.activeProjects || 0).toString(),
      description: "In progress",
      icon: ClipboardCheck,
      color: "text-yellow-600",
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
    <div className="space-y-6 min-h-screen">
      {(() => {
        return (
          <>
            {/* Colorful Hero Window */}

            <div className="rounded-3xl shadow-2xl bg-gradient-to-br from-[#0056a6] via-[#00b6e3] to-[#ff7f32] p-12 min-h-[320px] flex flex-col md:flex-row items-center justify-between mb-4 relative overflow-hidden">
              <div className="flex-1 z-10">
                <div className="flex items-center mb-6">
                  <span className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">CIE Student Portal</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-gray-900 dark:text-white">Welcome to your learning hub!</h2>
                <p className="mb-8 max-w-2xl text-lg text-gray-700 dark:text-white/90">Track your courses, projects, and academic progress—all in one place.</p>
                <div className="flex gap-6">
                  <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-lg shadow transition-colors text-lg">Learn More</button>
                  <button className="bg-white hover:bg-gray-100 text-blue-700 font-semibold px-8 py-3 rounded-lg shadow transition-colors text-lg" onClick={handleQuickActionsClick}>Quick Actions</button>

                </div>
              {/* <img src="/logo.png" alt="CIE Watermark" className="absolute right-10 bottom-0 opacity-10 h-64 w-auto hidden md:block select-none pointer-events-none" /> */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-2">
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

            {/* Academic Progress */}
            {dashboardData?.academicProgress && dashboardData.stats.creditsCompleted !== undefined && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ClipboardCheck className="h-5 w-5" />
                    <span>Academic Progress</span>
                  </CardTitle>
                  <CardDescription>Your academic journey and achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{dashboardData.stats.creditsCompleted || 0}</div>
                      <p className="text-sm text-gray-500">Credits Completed</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${((dashboardData.stats.creditsCompleted || 0) / (dashboardData.stats.creditsRequired || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{dashboardData.stats.creditsRequired || 0} required</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{dashboardData.stats.currentGPA || "N/A"}</div>
                      <p className="text-sm text-gray-500">Current GPA</p>
                      <div className="flex justify-center mt-2">
                        {(dashboardData.academicProgress?.semesterGPA || []).slice(-3).map((gpa: number, index: number) => (
                          <div key={index} className="mx-1">
                            <div className="text-xs text-gray-600">{gpa}</div>
                            <div className="w-2 bg-green-200 rounded" style={{ height: `${gpa * 10}px` }}></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{dashboardData.stats.degreeProgress || 0}%</div>
                      <p className="text-sm text-gray-500">Degree Complete</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${dashboardData.stats.degreeProgress || 0}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Bachelor's Degree</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <Card className="transform hover:scale-105 focus:scale-105 transition-transform duration-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Today's Classes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                            <div className="h-3 bg-gray-200 rounded w-32"></div>
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                            <div className="h-3 bg-gray-200 rounded w-12"></div>
                          </div>
                        </div>
                      ))
                    ) : dashboardData?.todaysClasses?.length > 0 ? (
                      dashboardData.todaysClasses.map((classItem: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div>
                            <h3 className="font-medium">{classItem.course}</h3>
                            <p className="text-sm text-gray-600">{classItem.title}</p>
                            <p className="text-xs text-gray-500">{classItem.instructor}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{classItem.time}</p>
                            {classItem.endTime && (
                              <p className="text-xs text-gray-400">- {classItem.endTime}</p>
                            )}
                            <div className="flex items-center text-xs text-gray-500">
                              <MapPin className="h-3 w-3 mr-1" />
                              {classItem.location}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No classes today</p>
                        <p className="text-xs mt-1">Enjoy your free day!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="transform hover:scale-105 focus:scale-105 transition-transform duration-200">
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loading ? (
                      Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="flex items-center space-x-4 animate-pulse">
                          <div className="h-4 w-4 bg-gray-200 rounded"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-40"></div>
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                          </div>
                        </div>
                      ))
                    ) : dashboardData?.activities?.length > 0 ? (
                      dashboardData.activities.slice(0, 4).map((activity: any, index: number) => {
                        const iconColors = ['text-blue-600', 'text-green-600', 'text-orange-600', 'text-purple-600', 'text-red-600', 'text-indigo-600']
                        const iconColor = iconColors[index % iconColors.length]
                        const timeAgo = new Date(activity.time).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })
                        
                        const IconComponent = activity.type === 'project' ? FolderOpen :
                                            activity.type === 'component' ? Clock :
                                            activity.type === 'library' ? BookOpen :
                                            activity.type === 'enrollment' ? ClipboardCheck : FolderOpen
                        
                        return (
                          <div key={index} className="flex items-center space-x-4">
                            <IconComponent className={`h-4 w-4 ${iconColor}`} />
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
                        <p className="text-xs mt-1">Your activities will appear here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="transform hover:scale-105 focus:scale-105 transition-transform duration-200">
                <CardHeader>
                  <CardTitle>Active Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {loading ? (
                      Array.from({ length: 2 }).map((_, index) => (
                        <div key={index} className="p-3 border rounded-lg animate-pulse">
                          <div className="flex justify-between items-start mb-2">
                            <div className="space-y-2 flex-1">
                              <div className="h-4 bg-gray-200 rounded w-32"></div>
                              <div className="h-3 bg-gray-200 rounded w-24"></div>
                            </div>
                            <div className="h-6 bg-gray-200 rounded w-16"></div>
                          </div>
                          <div className="h-3 bg-gray-200 rounded w-28"></div>
                        </div>
                      ))
                    ) : dashboardData?.activeProjects?.length > 0 ? (
                      dashboardData.activeProjects.slice(0, 4).map((project: any, index: number) => {
                        const statusColors: Record<string, string> = {
                          'PENDING': 'bg-yellow-100 text-yellow-800',
                          'APPROVED': 'bg-blue-100 text-blue-800',
                          'IN_PROGRESS': 'bg-orange-100 text-orange-800',
                          'SUBMITTED': 'bg-green-100 text-green-800',
                          'GRADED': 'bg-purple-100 text-purple-800'
                        }
                        const statusColor = statusColors[project.status] || 'bg-gray-100 text-gray-800'
                        
                        return (
                          <div key={index} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 pr-3">
                                <h3 className="font-medium">{project.title}</h3>
                                <p className="text-sm text-gray-600">{project.description}</p>
                                {project.assignedBy && (
                                  <p className="text-xs text-gray-500 mt-1">Assigned by: {project.assignedBy}</p>
                                )}
                              </div>
                              <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${statusColor}`}>
                                {project.status.replace('_', ' ')}
                              </span>
                            </div>
                            {project.deadline && (
                              <div className="mt-2 flex justify-between items-center">
                                <p className="text-xs text-gray-500">
                                  Due: {new Date(project.deadline).toLocaleDateString()}
                                </p>
                                {project.daysLeft !== null && (
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    project.daysLeft < 0 ? 'bg-red-100 text-red-800' :
                                    project.daysLeft <= 3 ? 'bg-orange-100 text-orange-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {project.daysLeft < 0 ? `${Math.abs(project.daysLeft)} days overdue` :
                                     project.daysLeft === 0 ? 'Due today' :
                                     `${project.daysLeft} days left`}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No active projects</p>
                        <p className="text-xs mt-1">Projects will appear here when assigned</p>
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
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <button 
                      onClick={() => onPageChange?.("lab-components")}
                      className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium">Request Lab Components</div>
                      <div className="text-sm text-gray-500">Borrow equipment for projects</div>
                    </button>
                    <button 
                      onClick={() => onPageChange?.("attendance")}
                      className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium">View Attendance</div>
                      <div className="text-sm text-gray-500">Check your attendance record</div>
                    </button>
                    <button 
                      onClick={() => onPageChange?.("courses")}
                      className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium">Browse Courses</div>
                      <div className="text-sm text-gray-500">Explore available courses</div>
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
