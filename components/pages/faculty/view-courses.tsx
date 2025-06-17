"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, Clock, GraduationCap, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface Course {
  id: string
  code: string
  name: string
  description: string
  credits: number
  department: string
  semester: string
  maxStudents: number
  enrolledStudents: number
  sections: string[]
  faculty?: {
    user: {
      name: string
    }
  }
}

export function ViewCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/courses")
      const data = await response.json()
      setCourses(data.courses || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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
          <p className="text-gray-600 mt-2">Browse all courses offered this semester</p>
        </div>
        <Button onClick={fetchCourses} variant="outline">
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
          courses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5" />
                      <span>
                        {course.code} - {course.name}
                      </span>
                    </CardTitle>
                    <CardDescription>{course.department}</CardDescription>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">{course.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{course.credits} Credits</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>
                        {course.enrolledStudents}/{course.maxStudents} Students
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <GraduationCap className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">
                        Instructor: {course.faculty?.user.name || "Not assigned"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">Semester: {course.semester}</div>
                  </div>

                  <div>
                    <span className="text-sm font-medium">Sections:</span>
                    <div className="flex space-x-2 mt-1">
                      {course.sections.map((section) => (
                        <Badge key={section} variant="outline">
                          Section {section}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(course.enrolledStudents / course.maxStudents) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    {Math.round((course.enrolledStudents / course.maxStudents) * 100)}% Enrolled
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
