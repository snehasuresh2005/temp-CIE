"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"

interface ClassSchedule {
  id: string
  course: {
    course_id: string
    course_name: string
  }
  faculty: {
    user: {
      name: string
    }
  }
  room: string
  day_of_week: string
  start_time: string
  end_time: string
  section: string
}

export function FacultyCalendar() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [schedules, setSchedules] = useState<ClassSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!user?.id) return

      try {
        setIsLoading(true)
        const response = await fetch(`/api/class-schedules?facultyId=${user.id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch schedules")
        }

        const data = await response.json()
        setSchedules(data.schedules || [])
      } catch (error) {
        console.error("Error fetching schedules:", error)
        toast({
          title: "Error",
          description: "Failed to load your class schedule. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSchedules()
  }, [user, toast])

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const today = new Date()
  const currentDay = daysOfWeek[today.getDay()]

  const todaySchedules = schedules.filter((schedule) => schedule.day_of_week === currentDay)

  const weekSchedules = daysOfWeek.map((day) => ({
    day,
    schedules: schedules.filter((schedule) => schedule.day_of_week === day),
  }))

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Calendar</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                <Calendar className="h-5 w-5" />
                <span>Weekly Schedule</span>
              </CardTitle>
              <CardDescription>Your class schedule for this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weekSchedules.map(({ day, schedules }) => (
                  <div key={day} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-lg">{day}</h3>
                      {day === currentDay && <Badge variant="default">Today</Badge>}
                    </div>
                    {schedules.length === 0 ? (
                      <p className="text-gray-500 text-sm">No courses scheduled</p>
                    ) : (
                      <div className="space-y-2">
                        {schedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                          >
                            <div>
                              <h4 className="font-medium text-blue-900">{schedule.course.course_id}</h4>
                              <p className="text-sm text-blue-700">{schedule.course.course_name}</p>
                              <div className="flex items-center space-x-4 mt-1">
                                <div className="flex items-center text-xs text-blue-600">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                </div>
                                <div className="flex items-center text-xs text-blue-600">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {schedule.room}
                                </div>
                                <div className="flex items-center text-xs text-blue-600">
                                  <Badge variant="outline" className="text-xs">
                                    Section {schedule.section}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Today's Courses</span>
              </CardTitle>
              <CardDescription>Your schedule for today</CardDescription>
            </CardHeader>
            <CardContent>
              {todaySchedules.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No courses today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaySchedules.map((schedule) => (
                    <div key={schedule.id} className="p-3 border rounded-lg">
                      <h4 className="font-medium">{schedule.course.course_id}</h4>
                      <p className="text-sm text-gray-600">{schedule.course.course_name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <MapPin className="h-3 w-3 mr-1" />
                          {schedule.room}
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Badge variant="outline" className="text-xs">
                          Section {schedule.section}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Courses This Week</span>
                  <span className="font-medium">{schedules.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Courses Today</span>
                  <span className="font-medium">{todaySchedules.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Unique Courses</span>
                  <span className="font-medium">{new Set(schedules.map((s) => s.course.course_id)).size}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
