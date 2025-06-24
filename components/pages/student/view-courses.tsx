"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Calendar, UserPlus, Trash2, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

interface Course {
  id: string
  course_name: string
  course_description: string
  course_start_date: string
  course_end_date: string
  course_enrollments: string[]
  created_by: string
  created_date: string
  modified_by?: string
  modified_date: string
}

export function ViewCourses() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const fetchData = async () => {
    if (!user) return
    try {
      setLoading(true)
      const response = await fetch("/api/courses")
      const data = await response.json()
      setCourses(data.courses || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast({
        title: "Error",
        description: "Failed to load course data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const isEnrolled = (course: Course) => {
    return user && course.course_enrollments.includes(user.id)
  }

  const handleSignUp = async (courseId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to sign up for courses",
        variant: "destructive",
      })
      return
    }
    try {
      const response = await fetch(`/api/courses`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({ courseId, action: "enroll" }),
      })
      if (response.ok) {
        toast({ title: "Success", description: "Enrolled in course!" })
        fetchData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to enroll")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to enroll in course",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading courses...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Available Courses</h1>
          <p className="text-gray-600 mt-2">Browse and sign up for available courses</p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {courses.length === 0 ? (
          <Card className="col-span-2">
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
              <p className="text-gray-600">Check back later for available courses.</p>
            </CardContent>
          </Card>
        ) : (
          courses.map((course) => {
            const enrolled = isEnrolled(course)
            return (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <BookOpen className="h-5 w-5" />
                        <span>{course.course_name}</span>
                      </CardTitle>
                      <CardDescription>{course.course_description}</CardDescription>
                    </div>
                    <div className="flex flex-col space-y-1 items-end">
                      {enrolled ? (
                        <Badge variant="default">Enrolled</Badge>
                      ) : (
                        <Badge variant="outline">Available</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Start: {new Date(course.course_start_date).toLocaleDateString()}</span>
                      <span className="text-sm">End: {new Date(course.course_end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-gray-500">Created by: {course.created_by}</div>
                    <div className="flex space-x-2 mt-2">
                      {!enrolled && (
                        <Button size="sm" onClick={() => handleSignUp(course.id)}>
                          <UserPlus className="h-4 w-4 mr-1" /> Sign Up
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
