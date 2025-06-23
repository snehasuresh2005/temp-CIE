"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, User } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"

interface ClassSchedule {
  id: string
  course: {
    code: string
    name: string
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

export function StudentCalendar() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [schedules, setSchedules] = useState<ClassSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!user?.id) return

      try {
        setIsLoading(true)
        const response = await fetch(`/api/class-schedules?studentId=${user.student_id}`)

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
        <h1 className="text-3xl font-bold text-gray-900">My Calendar</h1>
        <p className="text-gray-600 mt-2">View your class schedule and upcoming sessions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
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
                      <p className="text-gray-500 text-sm">No classes scheduled</p>
                    ) : (
                      <div className="space-y-2">
                        {schedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                          >
                            <div>
                              <h4 className="font-medium text-green-900">{schedule.course.code}</h4>
                              <p className="text-sm text-green-700">{schedule.course.name}</p>
                              <div className="flex items-center space-x-4 mt-1">
                                <div className="flex items-center text-xs text-green-600">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                </div>
                                <div className="flex items-center text-xs text-green-600">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {schedule.room}
                                </div>
                                <div className="flex items-center text-xs text-green-600">
                                  <User className="h-3 w-3 mr-1" />
                                  {schedule.faculty.user.name}
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
                <span>Today's Classes</span>
              </CardTitle>
              <CardDescription>Your schedule for today</CardDescription>
            </CardHeader>
            <CardContent>
              {todaySchedules.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No classes today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaySchedules.map((schedule) => (
                    <div key={schedule.id} className="p-3 border rounded-lg">
                      <h4 className="font-medium">{schedule.course.code}</h4>
                      <p className="text-sm text-gray-600">{schedule.course.name}</p>
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
                        <User className="h-3 w-3 mr-1" />
                        {schedule.faculty.user.name}
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
                  <span className="text-sm text-gray-600">Total Classes This Week</span>
                  <span className="font-medium">{schedules.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Classes Today</span>
                  <span className="font-medium">{todaySchedules.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Enrolled Courses</span>
                  <span className="font-medium">{new Set(schedules.map((s) => s.course.code)).size}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
